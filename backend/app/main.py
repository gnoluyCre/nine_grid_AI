from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api import router
from .database import Database
from .repositories import ChartRecordRepository
from .runtime import ensure_project_root
from .schemas import ErrorResponse
from .services import BirthChartService, ChartRecordService
from .services.chart_service import ChartRequestError


def resolve_database_path() -> Path:
    configured_path = os.environ.get("NINE_GRID_DB_PATH")
    if configured_path:
        return Path(configured_path)
    project_root = ensure_project_root()
    return project_root / "backend" / "data" / "nine_grid.sqlite3"


def create_app(db_path: str | Path | None = None) -> FastAPI:
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
    chart_record_repository = ChartRecordRepository(database)
    chart_record_service = ChartRecordService(chart_record_repository, chart_service)
    app.state.database = database
    app.state.chart_service = chart_service
    app.state.chart_record_service = chart_record_service
    app.include_router(router)

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.exception_handler(ChartRequestError)
    async def handle_request_error(_: Request, exc: ChartRequestError) -> JSONResponse:
        payload = ErrorResponse(code="bad_request", message=str(exc))
        return JSONResponse(status_code=400, content=payload.model_dump())

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
