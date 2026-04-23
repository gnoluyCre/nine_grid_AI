# input: AuthRepository、MailService、头像目录与认证请求模型。
# output: 登录、注册、验证码和密码重置业务能力。
# pos: 后端鉴权业务编排核心。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

import base64
import hashlib
import re
import secrets
import sqlite3
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path

from ..repositories import AuthRepository
from ..runtime import ensure_project_root
from ..schemas.requests import (
    LoginRequest,
    PasswordResetConfirmRequest,
    PasswordResetSendCodeRequest,
    RegisterConfirmRequest,
    RegisterSendCodeRequest,
    UpdateProfileRequest,
)
from ..schemas.responses import CurrentUserResponse, MessageResponse
from .mail_service import MailDeliveryError, MailService

SESSION_COOKIE_NAME = "nine_grid_session"
SESSION_TTL_DAYS = 7
PBKDF2_ITERATIONS = 120_000
VERIFICATION_CODE_TTL_MINUTES = 10
VERIFICATION_COOLDOWN_SECONDS = 60
VERIFICATION_HOURLY_LIMIT = 10
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class AuthError(ValueError):
    def __init__(self, message: str, *, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class AuthSessionResult:
    user: CurrentUserResponse
    session_token: str


class AuthService:
    def __init__(
        self,
        repository: AuthRepository,
        mail_service: MailService,
        avatar_dir: str | Path | None = None,
    ) -> None:
        self._repository = repository
        self._mail_service = mail_service
        project_root = ensure_project_root()
        self._avatar_dir = Path(avatar_dir) if avatar_dir else project_root / "assets" / "headImg"

    def send_register_code(self, request: RegisterSendCodeRequest) -> MessageResponse:
        self._cleanup_expired_state()
        email = self._normalize_email(request.email)
        self._validate_register_form(request.nickname, email, request.password, request.confirmPassword)
        existing_user = self._repository.get_user_by_email(email)
        if existing_user is not None:
            raise AuthError("该邮箱已注册")
        self._send_verification_code(email=email, purpose="register")
        return MessageResponse(message="验证码已发送，请查收邮箱")

    def confirm_register(
        self,
        request: RegisterConfirmRequest,
        *,
        user_agent: str | None,
        ip_address: str | None,
    ) -> AuthSessionResult:
        self._cleanup_expired_state()
        email = self._normalize_email(request.email)
        self._validate_register_form(request.nickname, email, request.password, request.confirmPassword)
        if self._repository.get_user_by_email(email) is not None:
            raise AuthError("该邮箱已注册")
        self._verify_code(email=email, purpose="register", code=request.verificationCode)

        timestamp = self._now_text()
        avatar_key = self._pick_random_avatar()
        password_hash = self._hash_password(request.password)

        for _ in range(20):
            try:
                user_id = self._repository.create_user(
                    {
                        "email": email,
                        "password_hash": password_hash,
                        "nickname": request.nickname.strip(),
                        "user_code": self._generate_user_code(),
                        "avatar_key": avatar_key,
                        "created_at": timestamp,
                        "updated_at": timestamp,
                    }
                )
                user_row = self._repository.get_user_by_id(user_id)
                if user_row is None:
                    raise AuthError("用户注册成功后无法读取")
                return self._create_session_result(user_row, user_agent=user_agent, ip_address=ip_address)
            except sqlite3.IntegrityError:
                continue
        raise AuthError("用户编号生成失败，请稍后重试")

    def login(self, request: LoginRequest, *, user_agent: str | None, ip_address: str | None) -> AuthSessionResult:
        self._cleanup_expired_state()
        email = self._normalize_email(request.email)
        user_row = self._repository.get_user_by_email(email)
        if user_row is None or not self._verify_password(request.password, user_row["password_hash"]):
            raise AuthError("邮箱或密码错误", status_code=401)
        return self._create_session_result(user_row, user_agent=user_agent, ip_address=ip_address)

    def send_password_reset_code(self, request: PasswordResetSendCodeRequest) -> MessageResponse:
        self._cleanup_expired_state()
        email = self._normalize_email(request.email)
        self._validate_email(email)
        if self._repository.get_user_by_email(email) is None:
            return MessageResponse(message="如果该邮箱已注册，验证码已发送，请查收邮箱")
        self._send_verification_code(email=email, purpose="reset_password")
        return MessageResponse(message="如果该邮箱已注册，验证码已发送，请查收邮箱")

    def reset_password(self, request: PasswordResetConfirmRequest) -> MessageResponse:
        self._cleanup_expired_state()
        email = self._normalize_email(request.email)
        self._validate_email(email)
        self._validate_password_pair(request.newPassword, request.confirmPassword)
        user_row = self._repository.get_user_by_email(email)
        if user_row is None:
            raise AuthError("验证码错误或已失效")
        self._verify_code(email=email, purpose="reset_password", code=request.verificationCode)
        updated_user = self._repository.update_password(
            int(user_row["id"]),
            self._hash_password(request.newPassword),
            self._now_text(),
        )
        if updated_user is None:
            raise AuthError("用户不存在", status_code=401)
        return MessageResponse(message="密码已重置，请使用新密码登录")

    def logout(self, session_token: str | None) -> None:
        if not session_token:
            return
        self._repository.delete_session(self._hash_session_token(session_token))

    def get_current_user(self, session_token: str | None) -> CurrentUserResponse | None:
        if not session_token:
            return None
        self._repository.delete_expired_sessions(self._now_text())
        session_row = self._repository.get_session_with_user(
            self._hash_session_token(session_token),
            self._now_text(),
        )
        if session_row is None:
            return None
        self._repository.touch_session(session_row["session_id"], self._now_text())
        return self._map_user_row(
            {
                "id": session_row["user_account_id"],
                "email": session_row["email"],
                "nickname": session_row["nickname"],
                "user_code": session_row["user_code"],
                "avatar_key": session_row["avatar_key"],
                "created_at": session_row["user_created_at"],
                "updated_at": session_row["user_updated_at"],
            }
        )

    def require_current_user(self, session_token: str | None) -> CurrentUserResponse:
        user = self.get_current_user(session_token)
        if user is None:
            raise AuthError("请先登录", status_code=401)
        return user

    def update_profile(self, user_id: int, request: UpdateProfileRequest) -> CurrentUserResponse:
        updated_user = self._repository.update_nickname(user_id, request.nickname.strip(), self._now_text())
        if updated_user is None:
            raise AuthError("用户不存在", status_code=401)
        return self._map_user_row(updated_user)

    @staticmethod
    def build_cookie_settings() -> dict[str, object]:
        max_age = int(timedelta(days=SESSION_TTL_DAYS).total_seconds())
        return {
            "key": SESSION_COOKIE_NAME,
            "httponly": True,
            "samesite": "lax",
            "path": "/",
            "max_age": max_age,
        }

    def _send_verification_code(self, *, email: str, purpose: str) -> None:
        now = self._now_text()
        latest = self._repository.get_latest_verification_code(email, purpose)
        if latest is not None and latest["created_at"] >= self._now_text(offset=timedelta(seconds=-VERIFICATION_COOLDOWN_SECONDS)):
            raise AuthError(f"验证码发送过于频繁，请在 {VERIFICATION_COOLDOWN_SECONDS} 秒后重试")
        if self._repository.count_recent_verification_codes(
            email,
            purpose,
            self._now_text(offset=timedelta(hours=-1)),
        ) >= VERIFICATION_HOURLY_LIMIT:
            raise AuthError("验证码发送过于频繁，请稍后再试")

        code = self._generate_verification_code()
        try:
            self._mail_service.send_verification_code(email, code, purpose)
        except MailDeliveryError as exc:
            raise AuthError(str(exc), status_code=500) from exc

        self._repository.consume_open_verification_codes(email, purpose, now)
        self._repository.create_verification_code(
            {
                "email": email,
                "code_hash": self._hash_verification_code(email, purpose, code),
                "purpose": purpose,
                "expires_at": self._now_text(offset=timedelta(minutes=VERIFICATION_CODE_TTL_MINUTES)),
                "created_at": now,
                "send_count": 1,
            }
        )

    def _verify_code(self, *, email: str, purpose: str, code: str) -> None:
        record = self._repository.get_latest_verification_code(email, purpose)
        if record is None:
            raise AuthError("验证码错误或已失效")
        if record["expires_at"] <= self._now_text():
            raise AuthError("验证码已过期，请重新获取")
        if not secrets.compare_digest(record["code_hash"], self._hash_verification_code(email, purpose, code.strip())):
            raise AuthError("验证码错误或已失效")
        self._repository.consume_verification_code(int(record["id"]), self._now_text())

    def _create_session_result(self, user_row: dict[str, object], *, user_agent: str | None, ip_address: str | None) -> AuthSessionResult:
        session_token = secrets.token_urlsafe(32)
        timestamp = self._now_text()
        expires_at = self._now_text(offset=timedelta(days=SESSION_TTL_DAYS))
        self._repository.create_session(
            {
                "user_id": user_row["id"],
                "session_token_hash": self._hash_session_token(session_token),
                "expires_at": expires_at,
                "created_at": timestamp,
                "last_seen_at": timestamp,
                "user_agent": user_agent,
                "ip_address": ip_address,
            }
        )
        return AuthSessionResult(user=self._map_user_row(user_row), session_token=session_token)

    def _validate_register_form(self, nickname: str, email: str, password: str, confirm_password: str) -> None:
        if not nickname.strip():
            raise AuthError("昵称不能为空")
        self._validate_email(email)
        self._validate_password_pair(password, confirm_password)

    @staticmethod
    def _validate_password_pair(password: str, confirm_password: str) -> None:
        if len(password) < 6:
            raise AuthError("密码至少需要 6 位字符")
        if password != confirm_password:
            raise AuthError("两次输入的密码不一致")

    @staticmethod
    def _normalize_email(email: str) -> str:
        return email.strip().lower()

    @staticmethod
    def _validate_email(email: str) -> None:
        if not EMAIL_PATTERN.match(email):
            raise AuthError("邮箱格式不正确")

    def _cleanup_expired_state(self) -> None:
        current_time = self._now_text()
        self._repository.delete_expired_sessions(current_time)
        self._repository.delete_expired_verification_codes(current_time)

    def _pick_random_avatar(self) -> str:
        avatar_files = sorted(path.name for path in self._avatar_dir.glob("*") if path.is_file())
        if not avatar_files:
            return "img01.png"
        return secrets.choice(avatar_files)

    @staticmethod
    def _generate_user_code() -> str:
        return "".join(secrets.choice("0123456789") for _ in range(6))

    @staticmethod
    def _generate_verification_code() -> str:
        return "".join(secrets.choice("0123456789") for _ in range(6))

    @staticmethod
    def _hash_password(password: str) -> str:
        salt = secrets.token_bytes(16)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
        return "pbkdf2_sha256${}${}${}".format(
            PBKDF2_ITERATIONS,
            base64.b64encode(salt).decode("ascii"),
            base64.b64encode(digest).decode("ascii"),
        )

    @staticmethod
    def _verify_password(password: str, stored_hash: str) -> bool:
        algorithm, iterations_text, salt_b64, digest_b64 = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        salt = base64.b64decode(salt_b64.encode("ascii"))
        expected = base64.b64decode(digest_b64.encode("ascii"))
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iterations_text))
        return secrets.compare_digest(actual, expected)

    @staticmethod
    def _hash_verification_code(email: str, purpose: str, code: str) -> str:
        material = f"{email}:{purpose}:{code.strip()}".encode("utf-8")
        return hashlib.sha256(material).hexdigest()

    @staticmethod
    def _hash_session_token(session_token: str) -> str:
        return hashlib.sha256(session_token.encode("utf-8")).hexdigest()

    @staticmethod
    def _now_text(offset: timedelta | None = None) -> str:
        now = datetime.now(UTC)
        if offset:
            now += offset
        return now.replace(microsecond=0).isoformat(sep=" ")

    @staticmethod
    def _map_user_row(user_row: dict[str, object]) -> CurrentUserResponse:
        return CurrentUserResponse(
            id=user_row["id"],
            email=user_row["email"],
            nickname=user_row["nickname"],
            userCode=user_row["user_code"],
            avatarKey=user_row["avatar_key"],
            createdAt=user_row["created_at"],
            updatedAt=user_row["updated_at"],
        )
