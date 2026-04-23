# input: 服务层产出的排盘结果、档案列表/详情结果与用户信息字段。
# output: API 对外响应模型与档案列表/结果页展示字段。
# pos: API 输出模型定义层。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


ChartMode = Literal["yang", "yin"]
BannerType = Literal["info", "warning"]
BannerCode = Literal["zi-hour", "lunar-leap"]
CellMarkerType = Literal["count", "mainSoul", "subSoul", "po", "missing"]
CellMarkerPosition = Literal[
    "top-left",
    "right-middle",
    "bottom-left",
    "top-right",
    "bottom",
]
ZiHourType = Literal["前子时", "后子时", "非子时"]
BatchExportStatus = Literal["pending", "running", "completed", "failed"]


class RegionOption(BaseModel):
    id: str
    provinceName: str
    cityName: str
    districtName: str
    longitude: float


class ResultSummaryViewModel(BaseModel):
    name: str | None = None
    gender: str
    inputBirthDate: str
    inputBirthTime: str
    regionText: str
    trueSolarDatetimeText: str
    trueSolarShichen: str
    ziHourType: ZiHourType


class BannerViewModel(BaseModel):
    type: BannerType
    code: BannerCode
    title: str
    description: str


class CellMarkerViewModel(BaseModel):
    type: CellMarkerType
    position: CellMarkerPosition
    value: str | None = None


class GridCellViewModel(BaseModel):
    id: str
    cellNumber: int | None
    centerDigit: str
    isPlaceholder: bool
    count: int
    isMainSoul: bool
    isSubSoul: bool
    isPo: bool
    isMissing: bool
    mainSoulCount: int
    subSoulCount: int
    poCount: int
    hasMissing: bool
    markers: list[CellMarkerViewModel]


class GridBoardViewModel(BaseModel):
    chartType: ChartMode
    digitString: str
    missingDigits: str
    missingAttributes: str
    missingCount: int
    po: str
    poRaw: str
    mainSoul: str
    subSoul: str
    halfSupplement: str
    cells: list[GridCellViewModel]


class CaseMetricsViewModel(BaseModel):
    solarBirthday: str
    lunarBirthday: str
    lunarBirthdayDisplay: str
    age: int
    trueSolarShichen: str
    lunarIsLeapMonth: bool


class ApiCaseChartsViewModel(BaseModel):
    yang: GridBoardViewModel
    yin: GridBoardViewModel


class ApiCaseViewModel(BaseModel):
    index: int
    label: str
    metrics: CaseMetricsViewModel
    charts: ApiCaseChartsViewModel


class BirthChartApiResponse(BaseModel):
    summary: ResultSummaryViewModel
    banners: list[BannerViewModel]
    cases: list[ApiCaseViewModel]


class BatchExportJobResponse(BaseModel):
    jobId: str
    status: BatchExportStatus
    downloadReady: bool
    message: str | None = None
    fileName: str | None = None
    totalDays: int = 0
    processedDays: int = 0
    progressPercent: int = 0
    currentDate: str | None = None


class ChartRecordListItem(BaseModel):
    id: int
    name: str | None = None
    gender: str
    birthDate: str
    birthTime: str
    regionId: str
    regionText: str
    ziHourType: ZiHourType
    caseCount: int
    hasLunarLeapCase: bool
    trueSolarDatetimeText: str
    trueSolarShichen: str
    createdAt: str
    firstCaseSolarBirthday: str
    firstCaseLunarBirthday: str
    firstCaseYangDigitString: str
    firstCaseYangMissingDigits: str
    firstCaseYinDigitString: str
    firstCaseYinMissingDigits: str


class ChartRecordListResponse(BaseModel):
    items: list[ChartRecordListItem]
    total: int
    page: int
    pageSize: int


class ChartRecordDetailResponse(BaseModel):
    id: int
    name: str | None = None
    gender: str
    birthDate: str
    birthTime: str
    inputDatetimeText: str
    regionId: str
    regionText: str
    longitude: float
    ziHourType: ZiHourType
    caseCount: int
    hasLunarLeapCase: bool
    trueSolarDatetimeText: str
    trueSolarShichen: str
    createdAt: str
    updatedAt: str
    banners: list[BannerViewModel]
    cases: list[ApiCaseViewModel]


class CurrentUserResponse(BaseModel):
    id: int
    email: str
    nickname: str
    userCode: str
    avatarKey: str
    createdAt: str
    updatedAt: str


class MessageResponse(BaseModel):
    message: str
