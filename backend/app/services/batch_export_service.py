# input: BirthChartService、日期范围与可配置临时文件目录。
# output: 一次性批量测算任务、xlsx 导出文件与任务状态查询能力。
# pos: 后端批量导出服务层。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

import tempfile
import threading
import uuid
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

from openpyxl import Workbook

from ..schemas.requests import BatchExportRequest, BirthChartRequest
from ..schemas.responses import BatchExportJobResponse, BatchExportStatus
from .chart_service import BirthChartService, ChartRequestError

MAX_BATCH_EXPORT_YEARS = 30
JOB_RETENTION_MINUTES = 30


@dataclass
class BatchExportJob:
    job_id: str
    start_date: str
    end_date: str
    status: BatchExportStatus
    message: str = ""
    download_ready: bool = False
    file_name: str = ""
    file_path: str = ""
    total_days: int = 0
    processed_days: int = 0
    progress_percent: int = 0
    current_date: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))


class BatchExportService:
    def __init__(self, chart_service: BirthChartService, temp_dir: str | Path | None = None) -> None:
        self._chart_service = chart_service
        self._jobs: dict[str, BatchExportJob] = {}
        self._lock = threading.Lock()
        self._temp_dir = Path(temp_dir) if temp_dir else Path(tempfile.gettempdir()) / "nine_grid_batch_exports"
        self._temp_dir.mkdir(parents=True, exist_ok=True)

    def create_job(self, request: BatchExportRequest) -> BatchExportJobResponse:
        start_date, end_date = self._validate_date_range(request.startDate, request.endDate)
        self._cleanup_jobs()
        self._ensure_no_running_job()
        job_id = uuid.uuid4().hex
        now = datetime.now(UTC)
        total_days = (end_date - start_date).days + 1
        job = BatchExportJob(
            job_id=job_id,
            start_date=request.startDate,
            end_date=request.endDate,
            status="pending",
            message="等待导出",
            total_days=total_days,
            created_at=now,
            updated_at=now,
        )
        with self._lock:
            self._jobs[job_id] = job
        threading.Thread(target=self._run_job, args=(job_id, start_date, end_date), daemon=True).start()
        return self._to_response(job)

    def get_job(self, job_id: str) -> BatchExportJobResponse:
        self._cleanup_jobs()
        job = self._get_job_or_raise(job_id)
        return self._to_response(job)

    def get_download_file(self, job_id: str) -> tuple[Path, str]:
        self._cleanup_jobs()
        job = self._get_job_or_raise(job_id)
        if job.status != "completed" or not job.download_ready or not job.file_path:
            raise ChartRequestError("批量导出文件尚未生成")
        file_path = Path(job.file_path)
        if not file_path.exists():
            raise ChartRequestError("批量导出文件已失效，请重新导出")
        return file_path, job.file_name

    def _run_job(self, job_id: str, start_date: date, end_date: date) -> None:
        self._update_job(job_id, status="running", message="导出中")
        file_name = f"九宫格批量测算_{start_date.isoformat()}_{end_date.isoformat()}.xlsx"
        file_path = self._temp_dir / f"{job_id}.xlsx"

        try:
            workbook = Workbook()
            worksheet = workbook.active
            worksheet.title = "批量测算"
            worksheet.append(["阳历生日", "阳格", "阳格缺漏", "农历生日", "阴格", "阴格缺漏"])

            current_date = start_date
            while current_date <= end_date:
                response = self._chart_service.build_birth_chart(
                    BirthChartRequest(
                        name="",
                        gender="未知",
                        birthDate=current_date.isoformat(),
                        birthTime="",
                        regionId="",
                    )
                )
                first_case = response.cases[0]
                worksheet.append(
                    [
                        first_case.metrics.solarBirthday,
                        first_case.charts.yang.digitString,
                        first_case.charts.yang.missingDigits,
                        first_case.metrics.lunarBirthday,
                        first_case.charts.yin.digitString,
                        first_case.charts.yin.missingDigits,
                    ]
                )
                processed_days = (current_date - start_date).days + 1
                progress_percent = int(processed_days * 100 / max(1, self._get_job_or_raise(job_id).total_days))
                self._update_job(
                    job_id,
                    status="running",
                    message="导出中",
                    processed_days=processed_days,
                    progress_percent=progress_percent,
                    current_date=current_date.isoformat(),
                )
                current_date += timedelta(days=1)

            workbook.save(file_path)

            self._update_job(
                job_id,
                status="completed",
                message="导出已完成",
                download_ready=True,
                file_name=file_name,
                file_path=str(file_path),
                processed_days=self._get_job_or_raise(job_id).total_days,
                progress_percent=100,
                current_date=end_date.isoformat(),
            )
        except Exception as exc:
            if file_path.exists():
                file_path.unlink(missing_ok=True)
            self._update_job(job_id, status="failed", message=str(exc), download_ready=False, file_name="", file_path="")

    def _validate_date_range(self, start_date_text: str, end_date_text: str) -> tuple[date, date]:
        try:
            start_date = date.fromisoformat(start_date_text)
            end_date = date.fromisoformat(end_date_text)
        except ValueError as exc:
            raise ChartRequestError("批量导出日期格式无效") from exc

        if start_date > end_date:
            raise ChartRequestError("开始日期不能晚于截止日期")
        if end_date > self._add_years(start_date, MAX_BATCH_EXPORT_YEARS):
            raise ChartRequestError("单次批量导出的日期跨度不能超过 30 年")
        return start_date, end_date

    @staticmethod
    def _add_years(source: date, years: int) -> date:
        try:
            return source.replace(year=source.year + years)
        except ValueError:
            return source.replace(month=2, day=28, year=source.year + years)

    def _cleanup_jobs(self) -> None:
        threshold = datetime.now(UTC) - timedelta(minutes=JOB_RETENTION_MINUTES)
        expired_job_ids: list[str] = []
        with self._lock:
            for job_id, job in self._jobs.items():
                if job.status in {"pending", "running"}:
                    continue
                if job.updated_at < threshold:
                    expired_job_ids.append(job_id)
            for job_id in expired_job_ids:
                job = self._jobs.pop(job_id)
                if job.file_path:
                    Path(job.file_path).unlink(missing_ok=True)

    def _ensure_no_running_job(self) -> None:
        with self._lock:
            has_active_job = any(job.status in {"pending", "running"} for job in self._jobs.values())
        if has_active_job:
            raise ChartRequestError("当前已有批量导出任务正在执行，请等待当前任务完成后再试")

    def _get_job_or_raise(self, job_id: str) -> BatchExportJob:
        with self._lock:
            job = self._jobs.get(job_id)
        if job is None:
            raise ChartRequestError("批量导出任务不存在或已失效")
        return job

    def _update_job(
        self,
        job_id: str,
        *,
        status: BatchExportStatus,
        message: str,
        download_ready: bool | None = None,
        file_name: str | None = None,
        file_path: str | None = None,
        processed_days: int | None = None,
        progress_percent: int | None = None,
        current_date: str | None = None,
    ) -> None:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return
            job.status = status
            job.message = message
            job.updated_at = datetime.now(UTC)
            if download_ready is not None:
                job.download_ready = download_ready
            if file_name is not None:
                job.file_name = file_name
            if file_path is not None:
                job.file_path = file_path
            if processed_days is not None:
                job.processed_days = processed_days
            if progress_percent is not None:
                job.progress_percent = progress_percent
            if current_date is not None:
                job.current_date = current_date

    @staticmethod
    def _to_response(job: BatchExportJob) -> BatchExportJobResponse:
        return BatchExportJobResponse(
            jobId=job.job_id,
            status=job.status,
            downloadReady=job.download_ready,
            message=job.message,
            fileName=job.file_name or None,
            totalDays=job.total_days,
            processedDays=job.processed_days,
            progressPercent=job.progress_percent,
            currentDate=job.current_date,
        )
