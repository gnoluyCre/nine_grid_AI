# input: 环境变量、数据库、服务对象与 FastAPI 中间件配置。
# output: 已装配完成的 FastAPI 应用实例。
# pos: 后端运行时总入口。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .api import router
from .database import Database
from .repositories import AuthRepository, ChartRecordRepository
from .runtime import ensure_project_root
from .schemas import ErrorResponse
from .services import AuthError, AuthService, BirthChartService, ChartRecordService, MailService, SmtpMailService
from .services.chart_service import ChartRequestError


def load_env_files() -> None:
    project_root = ensure_project_root()
    env_candidates = [
        project_root / ".env",
        project_root / "backend" / ".env",
    ]
    for env_path in env_candidates:
        if not env_path.exists():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            if not key or key in os.environ:
                continue
            os.environ[key] = value.strip().strip("\"'")


def resolve_database_path() -> Path:
    configured_path = os.environ.get("NINE_GRID_DB_PATH")
    if configured_path:
        return Path(configured_path)
    project_root = ensure_project_root()
    return project_root / "backend" / "data" / "nine_grid.sqlite3"


def create_app(db_path: str | Path | None = None, mail_service: MailService | None = None) -> FastAPI:
    load_env_files()
    app = FastAPI(
        title="Nine Grid Backend API",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://127.0.0.1:5173",
            "http://localhost:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    database = Database(db_path or resolve_database_path())
    database.initialize()
    chart_service = BirthChartService()
    auth_repository = AuthRepository(database)
    auth_service = AuthService(auth_repository, mail_service or SmtpMailService.from_env())
    chart_record_repository = ChartRecordRepository(database)
    chart_record_service = ChartRecordService(chart_record_repository, chart_service)
    app.state.database = database
    app.state.auth_service = auth_service
    app.state.chart_service = chart_service
    app.state.chart_record_service = chart_record_service
    app.mount("/assets", StaticFiles(directory=ensure_project_root() / "assets"), name="assets")
    app.include_router(router)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.exception_handler(ChartRequestError)
    async def handle_request_error(_: Request, exc: ChartRequestError) -> JSONResponse:
        payload = ErrorResponse(code="bad_request", message=str(exc))
        return JSONResponse(status_code=400, content=payload.model_dump())

    @app.exception_handler(AuthError)
    async def handle_auth_error(_: Request, exc: AuthError) -> JSONResponse:
        payload = ErrorResponse(code="auth_error", message=str(exc))
        return JSONResponse(status_code=exc.status_code, content=payload.model_dump())

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        payload = ErrorResponse(code="validation_error", message="请求参数校验失败", details=exc.errors())
        return JSONResponse(status_code=422, content=payload.model_dump())

    @app.exception_handler(Exception)
    async def handle_unexpected_error(_: Request, exc: Exception) -> JSONResponse:
        payload = ErrorResponse(code="internal_error", message="服务内部异常", details=str(exc))
        return JSONResponse(status_code=500, content=payload.model_dump())

    return app


app = create_app()
