# input: SMTP 环境变量、验证码内容与邮件发送场景。
# output: 邮件发送抽象与 SMTP 实现。
# pos: 后端验证码邮件基础设施层。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

import os
import smtplib
import ssl
from dataclasses import dataclass
from email.message import EmailMessage


class MailDeliveryError(RuntimeError):
    pass


@dataclass(frozen=True)
class VerificationMail:
    recipient: str
    code: str
    purpose: str


class MailService:
    def send_verification_code(self, recipient: str, code: str, purpose: str) -> None:
        raise NotImplementedError


class NullMailService(MailService):
    def send_verification_code(self, recipient: str, code: str, purpose: str) -> None:
        raise MailDeliveryError(
            "邮件服务未配置，请在环境变量或 .env 中设置 NINE_GRID_SMTP_USERNAME、"
            "NINE_GRID_SMTP_PASSWORD、NINE_GRID_MAIL_FROM"
        )


class SmtpMailService(MailService):
    def __init__(
        self,
        *,
        host: str,
        port: int,
        username: str,
        password: str,
        mail_from: str,
        use_ssl: bool,
    ) -> None:
        self._host = host
        self._port = port
        self._username = username
        self._password = password
        self._mail_from = mail_from
        self._use_ssl = use_ssl

    @classmethod
    def from_env(cls) -> MailService:
        host = os.environ.get("NINE_GRID_SMTP_HOST", "smtp.qq.com").strip()
        username = os.environ.get("NINE_GRID_SMTP_USERNAME", "").strip()
        password = os.environ.get("NINE_GRID_SMTP_PASSWORD", "").strip()
        mail_from = os.environ.get("NINE_GRID_MAIL_FROM", "").strip() or username
        if not host or not username or not password or not mail_from:
            return NullMailService()

        port_text = os.environ.get("NINE_GRID_SMTP_PORT", "465").strip() or "465"
        use_ssl_text = os.environ.get("NINE_GRID_SMTP_USE_SSL", "true").strip().lower()
        use_ssl = use_ssl_text not in {"0", "false", "no"}
        return cls(
            host=host,
            port=int(port_text),
            username=username,
            password=password,
            mail_from=mail_from,
            use_ssl=use_ssl,
        )

    def send_verification_code(self, recipient: str, code: str, purpose: str) -> None:
        message = EmailMessage()
        message["From"] = self._mail_from
        message["To"] = recipient
        message["Subject"] = self._build_subject(purpose)
        message.set_content(self._build_content(code, purpose))

        try:
            if self._use_ssl:
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(self._host, self._port, context=context) as smtp:
                    smtp.login(self._username, self._password)
                    smtp.send_message(message)
            else:
                with smtplib.SMTP(self._host, self._port) as smtp:
                    smtp.starttls(context=ssl.create_default_context())
                    smtp.login(self._username, self._password)
                    smtp.send_message(message)
        except OSError as exc:
            raise MailDeliveryError("验证码邮件发送失败") from exc
        except smtplib.SMTPException as exc:
            raise MailDeliveryError("验证码邮件发送失败") from exc

    @staticmethod
    def _build_subject(purpose: str) -> str:
        if purpose == "register":
            return "九宫格系统注册验证码"
        if purpose == "reset_password":
            return "九宫格系统密码重置验证码"
        return "九宫格系统邮箱验证码"

    @staticmethod
    def _build_content(code: str, purpose: str) -> str:
        scene_text = "注册账号" if purpose == "register" else "重置密码"
        return (
            f"你正在进行九宫格系统的{scene_text}操作。\n\n"
            f"本次验证码：{code}\n"
            "验证码 10 分钟内有效，仅可使用一次。\n\n"
            "如果这不是你的操作，请忽略这封邮件。"
        )
