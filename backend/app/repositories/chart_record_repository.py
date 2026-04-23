# input: Database 连接、排盘记录主表与明细表结构。
# output: 档案记录的增删改查仓储方法。
# pos: 后端排盘档案数据访问层。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

import json
from datetime import UTC, datetime
from dataclasses import dataclass
from typing import Any

from ..database import Database


@dataclass(frozen=True)
class ChartRecordFilters:
    name: str | None = None
    birth_date: str | None = None
    region_id: str | None = None
    zi_hour_type: str | None = None
    has_lunar_leap_case: bool | None = None
    digit_string: str | None = None
    chart_type: str | None = None


class ChartRecordRepository:
    def __init__(self, database: Database) -> None:
        self._database = database

    def create_record(
        self,
        user_id: int,
        record_data: dict[str, Any],
        case_data_list: list[dict[str, Any]],
    ) -> int:
        with self._database.connect() as connection:
            return self._save_record(connection, user_id, record_data, case_data_list)

    def update_record(
        self,
        user_id: int,
        record_id: int,
        record_data: dict[str, Any],
        case_data_list: list[dict[str, Any]],
    ) -> bool:
        with self._database.connect() as connection:
            existing = connection.execute(
                "SELECT id, created_at FROM chart_record WHERE id = ? AND user_id = ? AND is_deleted = 0",
                (record_id, user_id),
            ).fetchone()
            if existing is None:
                return False

            connection.execute(
                """
                UPDATE chart_record
                SET user_id = ?, name = ?, gender = ?, birth_date = ?, birth_time = ?, input_datetime_text = ?,
                    region_id = ?, province_name = ?, city_name = ?, district_name = ?, longitude = ?,
                    zi_hour_type = ?, case_count = ?, true_solar_datetime = ?, true_solar_shichen = ?,
                    has_lunar_leap_case = ?, source_payload_json = ?, is_deleted = 0, deleted_at = NULL, updated_at = ?
                WHERE id = ?
                """,
                (
                    user_id,
                    record_data["name"],
                    record_data["gender"],
                    record_data["birth_date"],
                    record_data["birth_time"],
                    record_data["input_datetime_text"],
                    record_data["region_id"],
                    record_data["province_name"],
                    record_data["city_name"],
                    record_data["district_name"],
                    record_data["longitude"],
                    record_data["zi_hour_type"],
                    record_data["case_count"],
                    record_data["true_solar_datetime"],
                    record_data["true_solar_shichen"],
                    int(record_data["has_lunar_leap_case"]),
                    record_data["source_payload_json"],
                    record_data["updated_at"],
                    record_id,
                ),
            )
            connection.execute("DELETE FROM chart_case WHERE record_id = ?", (record_id,))
            self._insert_cases(connection, record_id, case_data_list)
            connection.commit()
            return True

    def delete_record(self, user_id: int, record_id: int) -> bool:
        with self._database.connect() as connection:
            cursor = connection.execute(
                """
                UPDATE chart_record
                SET is_deleted = 1, deleted_at = ?, updated_at = ?
                WHERE id = ? AND user_id = ? AND is_deleted = 0
                """,
                (
                    datetime.now(UTC).replace(microsecond=0).isoformat(sep=" "),
                    datetime.now(UTC).replace(microsecond=0).isoformat(sep=" "),
                    record_id,
                    user_id,
                ),
            )
            connection.commit()
            return cursor.rowcount > 0

    def _save_record(
        self,
        connection,
        user_id: int,
        record_data: dict[str, Any],
        case_data_list: list[dict[str, Any]],
    ) -> int:
        cursor = connection.execute(
                """
                INSERT INTO chart_record (
                    user_id, name, gender, birth_date, birth_time, input_datetime_text, region_id,
                    province_name, city_name, district_name, longitude, zi_hour_type, case_count,
                    true_solar_datetime, true_solar_shichen, has_lunar_leap_case, source_payload_json,
                    is_deleted, deleted_at, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    record_data["name"],
                    record_data["gender"],
                    record_data["birth_date"],
                    record_data["birth_time"],
                    record_data["input_datetime_text"],
                    record_data["region_id"],
                    record_data["province_name"],
                    record_data["city_name"],
                    record_data["district_name"],
                    record_data["longitude"],
                    record_data["zi_hour_type"],
                    record_data["case_count"],
                    record_data["true_solar_datetime"],
                    record_data["true_solar_shichen"],
                    int(record_data["has_lunar_leap_case"]),
                    record_data["source_payload_json"],
                    int(record_data.get("is_deleted", 0)),
                    record_data.get("deleted_at"),
                    record_data["created_at"],
                    record_data["updated_at"],
                ),
            )
        record_id = int(cursor.lastrowid)
        self._insert_cases(connection, record_id, case_data_list)
        connection.commit()
        return record_id

    def _insert_cases(self, connection, record_id: int, case_data_list: list[dict[str, Any]]) -> None:
        for case_data in case_data_list:
            case_cursor = connection.execute(
                """
                INSERT INTO chart_case (
                    record_id, case_index, case_label, date_relation, solar_birthday,
                    lunar_birthday, lunar_birthday_display, age, true_solar_shichen, lunar_is_leap_month
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record_id,
                    case_data["case_index"],
                    case_data["case_label"],
                    case_data["date_relation"],
                    case_data["solar_birthday"],
                    case_data["lunar_birthday"],
                    case_data["lunar_birthday_display"],
                    case_data["age"],
                    case_data["true_solar_shichen"],
                    int(case_data["lunar_is_leap_month"]),
                ),
            )
            case_id = int(case_cursor.lastrowid)

            for grid_data in case_data["grids"]:
                connection.execute(
                    """
                    INSERT INTO chart_grid (
                        case_id, chart_type, digit_string, missing_digits, missing_attributes,
                        missing_count, po, po_raw, main_soul, sub_soul, half_supplement,
                        grid_cells_json, grid_snapshot_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        case_id,
                        grid_data["chart_type"],
                        grid_data["digit_string"],
                        grid_data["missing_digits"],
                        grid_data["missing_attributes"],
                        grid_data["missing_count"],
                        grid_data["po"],
                        grid_data["po_raw"],
                        grid_data["main_soul"],
                        grid_data["sub_soul"],
                        grid_data["half_supplement"],
                        grid_data["grid_cells_json"],
                        grid_data["grid_snapshot_json"],
                    ),
                )

    def list_records(self, user_id: int, filters: ChartRecordFilters, page: int, page_size: int) -> tuple[int, list[dict[str, Any]]]:
        conditions: list[str] = ["chart_record.user_id = ?", "chart_record.is_deleted = 0"]
        parameters: list[Any] = [user_id]

        if filters.name:
            conditions.append("chart_record.name LIKE ?")
            parameters.append(f"%{filters.name}%")
        if filters.birth_date:
            conditions.append("chart_record.birth_date = ?")
            parameters.append(filters.birth_date)
        if filters.region_id:
            conditions.append("chart_record.region_id = ?")
            parameters.append(filters.region_id)
        if filters.zi_hour_type:
            conditions.append("chart_record.zi_hour_type = ?")
            parameters.append(filters.zi_hour_type)
        if filters.has_lunar_leap_case is not None:
            conditions.append("chart_record.has_lunar_leap_case = ?")
            parameters.append(int(filters.has_lunar_leap_case))
        if filters.digit_string:
            grid_subquery = """
                EXISTS (
                    SELECT 1
                    FROM chart_case
                    JOIN chart_grid ON chart_grid.case_id = chart_case.id
                    WHERE chart_case.record_id = chart_record.id
                      AND chart_grid.digit_string = ?
            """
            parameters.append(filters.digit_string)
            if filters.chart_type:
                grid_subquery += " AND chart_grid.chart_type = ?"
                parameters.append(filters.chart_type)
            grid_subquery += ")"
            conditions.append(grid_subquery)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        offset = (page - 1) * page_size

        with self._database.connect() as connection:
            total = int(
                connection.execute(
                    f"SELECT COUNT(*) AS total FROM chart_record {where_clause}",
                    parameters,
                ).fetchone()["total"]
            )
            rows = connection.execute(
                f"""
                SELECT *
                FROM chart_record
                {where_clause}
                ORDER BY created_at DESC, id DESC
                LIMIT ? OFFSET ?
                """,
                [*parameters, page_size, offset],
            ).fetchall()
            return total, [dict(row) for row in rows]

    def get_record(self, user_id: int, record_id: int) -> dict[str, Any] | None:
        with self._database.connect() as connection:
            record_row = connection.execute(
                "SELECT * FROM chart_record WHERE id = ? AND user_id = ? AND is_deleted = 0",
                (record_id, user_id),
            ).fetchone()
            if record_row is None:
                return None

            record = dict(record_row)
            case_rows = connection.execute(
                """
                SELECT *
                FROM chart_case
                WHERE record_id = ?
                ORDER BY case_index ASC
                """,
                (record_id,),
            ).fetchall()
            cases: list[dict[str, Any]] = []
            for case_row in case_rows:
                case_data = dict(case_row)
                grid_rows = connection.execute(
                    """
                    SELECT *
                    FROM chart_grid
                    WHERE case_id = ?
                    ORDER BY chart_type ASC
                    """,
                    (case_data["id"],),
                ).fetchall()
                grids = [dict(grid_row) for grid_row in grid_rows]
                case_data["grids"] = grids
                cases.append(case_data)

            record["cases"] = cases
            return record

    @staticmethod
    def parse_json_text(value: str | None) -> Any:
        if not value:
            return None
        return json.loads(value)
