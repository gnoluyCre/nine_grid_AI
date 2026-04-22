from __future__ import annotations

import sqlite3
from pathlib import Path


class Database:
    def __init__(self, db_path: str | Path) -> None:
        self._db_path = Path(db_path)

    @property
    def path(self) -> Path:
        return self._db_path

    def connect(self) -> sqlite3.Connection:
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(self._db_path, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def initialize(self) -> None:
        with self.connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS chart_record (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NULL,
                    gender TEXT NOT NULL,
                    birth_date TEXT NOT NULL,
                    birth_time TEXT NOT NULL,
                    input_datetime_text TEXT NOT NULL,
                    region_id TEXT NOT NULL,
                    province_name TEXT NOT NULL,
                    city_name TEXT NOT NULL,
                    district_name TEXT NOT NULL,
                    longitude REAL NOT NULL,
                    zi_hour_type TEXT NOT NULL,
                    case_count INTEGER NOT NULL,
                    true_solar_datetime TEXT NOT NULL,
                    true_solar_shichen TEXT NOT NULL,
                    has_lunar_leap_case INTEGER NOT NULL DEFAULT 0,
                    source_payload_json TEXT NULL,
                    is_deleted INTEGER NOT NULL DEFAULT 0,
                    deleted_at TEXT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS chart_case (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    record_id INTEGER NOT NULL,
                    case_index INTEGER NOT NULL,
                    case_label TEXT NOT NULL,
                    date_relation TEXT NOT NULL,
                    solar_birthday TEXT NOT NULL,
                    lunar_birthday TEXT NOT NULL,
                    lunar_birthday_display TEXT NOT NULL,
                    age INTEGER NOT NULL,
                    true_solar_shichen TEXT NOT NULL,
                    lunar_is_leap_month INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY(record_id) REFERENCES chart_record(id) ON DELETE CASCADE,
                    UNIQUE(record_id, case_index)
                );

                CREATE TABLE IF NOT EXISTS chart_grid (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    case_id INTEGER NOT NULL,
                    chart_type TEXT NOT NULL,
                    digit_string TEXT NOT NULL,
                    missing_digits TEXT NOT NULL,
                    missing_attributes TEXT NOT NULL,
                    missing_count INTEGER NOT NULL,
                    po TEXT NOT NULL,
                    po_raw TEXT NOT NULL,
                    main_soul TEXT NOT NULL,
                    sub_soul TEXT NOT NULL,
                    half_supplement TEXT NOT NULL,
                    grid_cells_json TEXT NOT NULL,
                    grid_snapshot_json TEXT NOT NULL,
                    FOREIGN KEY(case_id) REFERENCES chart_case(id) ON DELETE CASCADE,
                    UNIQUE(case_id, chart_type)
                );

                CREATE INDEX IF NOT EXISTS idx_chart_record_birth_date
                    ON chart_record(birth_date);
                CREATE INDEX IF NOT EXISTS idx_chart_record_name_birth_date
                    ON chart_record(name, birth_date);
                CREATE INDEX IF NOT EXISTS idx_chart_record_region_id
                    ON chart_record(region_id);
                CREATE INDEX IF NOT EXISTS idx_chart_record_true_solar_datetime
                    ON chart_record(true_solar_datetime);
                CREATE INDEX IF NOT EXISTS idx_chart_record_zi_hour_type
                    ON chart_record(zi_hour_type);
                CREATE INDEX IF NOT EXISTS idx_chart_grid_digit_string
                    ON chart_grid(digit_string);
                CREATE INDEX IF NOT EXISTS idx_chart_grid_chart_type_digit_string
                    ON chart_grid(chart_type, digit_string);
                """
            )
            self._ensure_chart_record_soft_delete_columns(connection)
            connection.commit()

    @staticmethod
    def _ensure_chart_record_soft_delete_columns(connection: sqlite3.Connection) -> None:
        columns = {
            row["name"]
            for row in connection.execute("PRAGMA table_info(chart_record)").fetchall()
        }
        if "is_deleted" not in columns:
            connection.execute(
                "ALTER TABLE chart_record ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0"
            )
        if "deleted_at" not in columns:
            connection.execute(
                "ALTER TABLE chart_record ADD COLUMN deleted_at TEXT NULL"
            )
