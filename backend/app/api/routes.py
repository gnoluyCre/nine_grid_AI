# input: FastAPI 请求上下文、schemas 请求模型、app.state 服务实例。
# output: /api/v1 下的公开 HTTP 路由。
# pos: 后端对外接口层。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

from fastapi import APIRouter, Query, Request, Response

from ..schemas import (
    BirthChartApiResponse,
    BirthChartRequest,
    ChartRecordDetailResponse,
    ChartRecordListResponse,
    CurrentUserResponse,
    LoginRequest,
    MessageResponse,
    PasswordResetConfirmRequest,
    PasswordResetSendCodeRequest,
    RegionOption,
    RegisterConfirmRequest,
    RegisterSendCodeRequest,
    UpdateProfileRequest,
)

router = APIRouter(prefix="/api/v1", tags=["nine-grid"])


def require_current_user(http_request: Request) -> CurrentUserResponse:
    session_token = http_request.cookies.get("nine_grid_session")
    return http_request.app.state.auth_service.require_current_user(session_token)


@router.get("/regions", response_model=list[RegionOption])
def list_regions(request: Request) -> list[RegionOption]:
    return request.app.state.chart_service.list_regions()


@router.post("/charts", response_model=BirthChartApiResponse)
def create_birth_chart(request: BirthChartRequest, http_request: Request) -> BirthChartApiResponse:
    return http_request.app.state.chart_service.build_birth_chart(request)


@router.post("/auth/register/send-code", response_model=MessageResponse)
def send_register_code(request: RegisterSendCodeRequest, http_request: Request) -> MessageResponse:
    return http_request.app.state.auth_service.send_register_code(request)


@router.post("/auth/register/confirm", response_model=CurrentUserResponse)
def confirm_register(request: RegisterConfirmRequest, http_request: Request, response: Response) -> CurrentUserResponse:
    result = http_request.app.state.auth_service.confirm_register(
        request,
        user_agent=http_request.headers.get("user-agent"),
        ip_address=http_request.client.host if http_request.client else None,
    )
    response.set_cookie(value=result.session_token, **http_request.app.state.auth_service.build_cookie_settings())
    return result.user


@router.post("/auth/login", response_model=CurrentUserResponse)
def login(request: LoginRequest, http_request: Request, response: Response) -> CurrentUserResponse:
    result = http_request.app.state.auth_service.login(
        request,
        user_agent=http_request.headers.get("user-agent"),
        ip_address=http_request.client.host if http_request.client else None,
    )
    response.set_cookie(value=result.session_token, **http_request.app.state.auth_service.build_cookie_settings())
    return result.user


@router.post("/auth/logout", status_code=204)
def logout(http_request: Request, response: Response) -> Response:
    http_request.app.state.auth_service.logout(http_request.cookies.get("nine_grid_session"))
    response.delete_cookie(key="nine_grid_session", path="/", samesite="lax")
    response.status_code = 204
    return response


@router.post("/auth/password/send-code", response_model=MessageResponse)
def send_password_reset_code(request: PasswordResetSendCodeRequest, http_request: Request) -> MessageResponse:
    return http_request.app.state.auth_service.send_password_reset_code(request)


@router.post("/auth/password/reset", response_model=MessageResponse)
def reset_password(request: PasswordResetConfirmRequest, http_request: Request) -> MessageResponse:
    return http_request.app.state.auth_service.reset_password(request)


@router.get("/auth/me", response_model=CurrentUserResponse)
def get_current_user(http_request: Request) -> CurrentUserResponse:
    return require_current_user(http_request)


@router.patch("/auth/me", response_model=CurrentUserResponse)
def update_current_user(request: UpdateProfileRequest, http_request: Request) -> CurrentUserResponse:
    current_user = require_current_user(http_request)
    return http_request.app.state.auth_service.update_profile(current_user.id, request)


@router.post("/chart-records", response_model=ChartRecordDetailResponse)
def create_chart_record(request: BirthChartRequest, http_request: Request) -> ChartRecordDetailResponse:
    current_user = require_current_user(http_request)
    return http_request.app.state.chart_record_service.create_record(current_user.id, request)


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
    current_user = require_current_user(http_request)
    return http_request.app.state.chart_record_service.list_records(
        user_id=current_user.id,
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
    current_user = require_current_user(http_request)
    return http_request.app.state.chart_record_service.get_record(current_user.id, record_id)


@router.put("/chart-records/{record_id}", response_model=ChartRecordDetailResponse)
def update_chart_record(record_id: int, request: BirthChartRequest, http_request: Request) -> ChartRecordDetailResponse:
    current_user = require_current_user(http_request)
    return http_request.app.state.chart_record_service.update_record(current_user.id, record_id, request)


@router.delete("/chart-records/{record_id}", status_code=204)
def delete_chart_record(record_id: int, http_request: Request) -> Response:
    current_user = require_current_user(http_request)
    http_request.app.state.chart_record_service.delete_record(current_user.id, record_id)
    return Response(status_code=204)
