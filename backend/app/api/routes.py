from __future__ import annotations

from fastapi import APIRouter, Query, Request, Response

from ..schemas import (
    BirthChartApiResponse,
    BirthChartRequest,
    ChartRecordDetailResponse,
    ChartRecordListResponse,
    RegionOption,
)

router = APIRouter(prefix="/api/v1", tags=["nine-grid"])


@router.get("/regions", response_model=list[RegionOption])
def list_regions(request: Request) -> list[RegionOption]:
    return request.app.state.chart_service.list_regions()


@router.post("/charts", response_model=BirthChartApiResponse)
def create_birth_chart(request: BirthChartRequest, http_request: Request) -> BirthChartApiResponse:
    return http_request.app.state.chart_service.build_birth_chart(request)


@router.post("/chart-records", response_model=ChartRecordDetailResponse)
def create_chart_record(request: BirthChartRequest, http_request: Request) -> ChartRecordDetailResponse:
    return http_request.app.state.chart_record_service.create_record(request)


@router.get("/chart-records", response_model=ChartRecordListResponse)
def list_chart_records(
    http_request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    name: str | None = Query(default=None),
    birth_date: str | None = Query(default=None, alias="birthDate"),
    region_id: str | None = Query(default=None, alias="regionId"),
    zi_hour_type: str | None = Query(default=None, alias="ziHourType"),
    has_lunar_leap_case: bool | None = Query(default=None, alias="hasLunarLeapCase"),
    digit_string: str | None = Query(default=None, alias="digitString"),
    chart_type: str | None = Query(default=None, alias="chartType"),
) -> ChartRecordListResponse:
    return http_request.app.state.chart_record_service.list_records(
        page=page,
        page_size=page_size,
        name=name,
        birth_date=birth_date,
        region_id=region_id,
        zi_hour_type=zi_hour_type,
        has_lunar_leap_case=has_lunar_leap_case,
        digit_string=digit_string,
        chart_type=chart_type,
    )


@router.get("/chart-records/{record_id}", response_model=ChartRecordDetailResponse)
def get_chart_record(record_id: int, http_request: Request) -> ChartRecordDetailResponse:
    return http_request.app.state.chart_record_service.get_record(record_id)


@router.put("/chart-records/{record_id}", response_model=ChartRecordDetailResponse)
def update_chart_record(record_id: int, request: BirthChartRequest, http_request: Request) -> ChartRecordDetailResponse:
    return http_request.app.state.chart_record_service.update_record(record_id, request)


@router.delete("/chart-records/{record_id}", status_code=204)
def delete_chart_record(record_id: int, http_request: Request) -> Response:
    http_request.app.state.chart_record_service.delete_record(record_id)
    return Response(status_code=204)
