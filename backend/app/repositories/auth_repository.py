# input: Database 连接能力与鉴权相关表结构。
# output: 用户、会话、邮箱验证码的仓储读写方法。
# pos: 后端鉴权数据访问层。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

import sqlite3
from typing import Any

from ..database import Database


class AuthRepository:
    def __init__(self, database: Database) -> None:
        self._database = database

    def create_user(self, user_data: dict[str, Any]) -> int:
        with self._database.connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO user_account (
                    email, password_hash, nickname, user_code, avatar_key, is_deleted, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_data["email"],
                    user_data["password_hash"],
                    user_data["nickname"],
                    user_data["user_code"],
                    user_data["avatar_key"],
                    int(user_data.get("is_deleted", 0)),
                    user_data["created_at"],
                    user_data["updated_at"],
                ),
            )
            connection.commit()
            return int(cursor.lastrowid)

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        with self._database.connect() as connection:
            row = connection.execute(
                """
                SELECT *
                FROM user_account
                WHERE email = ? AND is_deleted = 0
                """,
                (email,),
            ).fetchone()
            return dict(row) if row else None

    def get_user_by_id(self, user_id: int) -> dict[str, Any] | None:
        with self._database.connect() as connection:
            row = connection.execute(
                """
                SELECT *
                FROM user_account
                WHERE id = ? AND is_deleted = 0
                """,
                (user_id,),
            ).fetchone()
            return dict(row) if row else None

    def update_nickname(self, user_id: int, nickname: str, updated_at: str) -> dict[str, Any] | None:
        with self._database.connect() as connection:
            cursor = connection.execute(
                """
                UPDATE user_account
                SET nickname = ?, updated_at = ?
                WHERE id = ? AND is_deleted = 0
                """,
                (nickname, updated_at, user_id),
            )
            connection.commit()
            if cursor.rowcount == 0:
                return None
        return self.get_user_by_id(user_id)

    def update_password(self, user_id: int, password_hash: str, updated_at: str) -> dict[str, Any] | None:
        with self._database.connect() as connection:
            cursor = connection.execute(
                """
                UPDATE user_account
                SET password_hash = ?, updated_at = ?
                WHERE id = ? AND is_deleted = 0
                """,
                (password_hash, updated_at, user_id),
            )
            connection.commit()
            if cursor.rowcount == 0:
                return None
        return self.get_user_by_id(user_id)

    def create_session(self, session_data: dict[str, Any]) -> int:
        with self._database.connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO user_session (
                    user_id, session_token_hash, expires_at, created_at, last_seen_at, user_agent, ip_address
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    session_data["user_id"],
                    session_data["session_token_hash"],
                    session_data["expires_at"],
                    session_data["created_at"],
                    session_data["last_seen_at"],
                    session_data["user_agent"],
                    session_data["ip_address"],
                ),
            )
            connection.commit()
            return int(cursor.lastrowid)

    def get_session_with_user(self, session_token_hash: str, current_time: str) -> dict[str, Any] | None:
        with self._database.connect() as connection:
            row = connection.execute(
                """
                SELECT
                    user_session.id AS session_id,
                    user_session.user_id,
                    user_session.session_token_hash,
                    user_session.expires_at,
                    user_session.created_at AS session_created_at,
                    user_session.last_seen_at,
                    user_session.user_agent,
                    user_session.ip_address,
                    user_account.id AS user_account_id,
                    user_account.email,
                    user_account.nickname,
                    user_account.user_code,
                    user_account.avatar_key,
                    user_account.created_at AS user_created_at,
                    user_account.updated_at AS user_updated_at
                FROM user_session
                JOIN user_account ON user_account.id = user_session.user_id
                WHERE user_session.session_token_hash = ?
                  AND user_session.expires_at > ?
                  AND user_account.is_deleted = 0
                """,
                (session_token_hash, current_time),
            ).fetchone()
            return dict(row) if row else None

    def touch_session(self, session_id: int, last_seen_at: str) -> None:
        with self._database.connect() as connection:
            connection.execute(
                "UPDATE user_session SET last_seen_at = ? WHERE id = ?",
                (last_seen_at, session_id),
            )
            connection.commit()

    def delete_session(self, session_token_hash: str) -> None:
        with self._database.connect() as connection:
            connection.execute(
                "DELETE FROM user_session WHERE session_token_hash = ?",
                (session_token_hash,),
            )
            connection.commit()

    def delete_expired_sessions(self, current_time: str) -> None:
        with self._database.connect() as connection:
            connection.execute(
                "DELETE FROM user_session WHERE expires_at <= ?",
                (current_time,),
            )
            connection.commit()

    def create_verification_code(self, verification_data: dict[str, Any]) -> int:
        with self._database.connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO email_verification_code (
                    email, code_hash, purpose, expires_at, consumed_at, created_at, send_count, ip_address
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    verification_data["email"],
                    verification_data["code_hash"],
                    verification_data["purpose"],
                    verification_data["expires_at"],
                    verification_data.get("consumed_at"),
                    verification_data["created_at"],
                    int(verification_data.get("send_count", 1)),
                    verification_data.get("ip_address"),
                ),
            )
            connection.commit()
            return int(cursor.lastrowid)

    def count_recent_verification_codes(self, email: str, purpose: str, since_time: str) -> int:
        with self._database.connect() as connection:
            row = connection.execute(
                """
                SELECT COUNT(*) AS total
                FROM email_verification_code
                WHERE email = ? AND purpose = ? AND created_at >= ?
                """,
                (email, purpose, since_time),
            ).fetchone()
            return int(row["total"]) if row else 0

    def get_latest_verification_code(self, email: str, purpose: str) -> dict[str, Any] | None:
        with self._database.connect() as connection:
            row = connection.execute(
                """
                SELECT *
                FROM email_verification_code
                WHERE email = ? AND purpose = ? AND consumed_at IS NULL
                ORDER BY created_at DESC, id DESC
                LIMIT 1
                """,
                (email, purpose),
            ).fetchone()
            return dict(row) if row else None

    def consume_open_verification_codes(self, email: str, purpose: str, consumed_at: str) -> None:
        with self._database.connect() as connection:
            connection.execute(
                """
                UPDATE email_verification_code
                SET consumed_at = ?
                WHERE email = ? AND purpose = ? AND consumed_at IS NULL
                """,
                (consumed_at, email, purpose),
            )
            connection.commit()

    def consume_verification_code(self, verification_id: int, consumed_at: str) -> None:
        with self._database.connect() as connection:
            connection.execute(
                "UPDATE email_verification_code SET consumed_at = ? WHERE id = ?",
                (consumed_at, verification_id),
            )
            connection.commit()

    def delete_expired_verification_codes(self, current_time: str) -> None:
        with self._database.connect() as connection:
            connection.execute(
                """
                DELETE FROM email_verification_code
                WHERE expires_at <= ? OR consumed_at IS NOT NULL
                """,
                (current_time,),
            )
            connection.commit()
