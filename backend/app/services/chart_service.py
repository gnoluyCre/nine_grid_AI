# input: 核心算法包、地区目录与排盘请求模型。
# output: 前端可直接展示的排盘结果视图模型。
# pos: 后端排盘计算服务层。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import datetime

from ..adapters import RegionCatalog
from ..adapters.region_catalog import RegionRecord
from ..runtime import ensure_project_root
from ..schemas.requests import BirthChartRequest
from ..schemas.responses import (
    ApiCaseChartsViewModel,
    ApiCaseViewModel,
    BannerViewModel,
    BirthChartApiResponse,
    CaseMetricsViewModel,
    GridBoardViewModel,
    GridCellViewModel,
    RegionOption,
    ResultSummaryViewModel,
)

ensure_project_root()

from nine_grid import RegionSelection, calculate_birth_chart  # noqa: E402
from nine_grid.calculator import (  # noqa: E402
    calc_nine_grid,
    calculate_main_soul,
    calculate_main_soul_source,
    calculate_po,
    calculate_sub_soul,
)

CELL_LAYOUT = [1, 4, 7, 2, 5, 8, 3, 6, 9, None, 0, None]
ZI_HOUR_BANNER = BannerViewModel(
    type="warning",
    code="zi-hour",
    title="子时双方案提示",
    description="当前结果存在两套有效方案，请结合方案切换一起查看，不要只读取第一套。",
)
LUNAR_LEAP_BANNER = BannerViewModel(
    type="info",
    code="lunar-leap",
    title="农历闰月提示",
    description="当前结果存在农历闰月方案，闰月补 1 会参与阴格正式计算，并可能影响最终串与灵魂结构。",
)


class ChartRequestError(ValueError):
    """Raised when the request is valid JSON but not a valid business request."""


@dataclass(frozen=True)
class ComputedBirthChart:
    response: BirthChartApiResponse
    region: RegionRecord
    raw_result: dict


class BirthChartService:
    def __init__(self, region_catalog: RegionCatalog | None = None) -> None:
        self._region_catalog = region_catalog or RegionCatalog()

    def list_regions(self) -> list[RegionOption]:
        return [
            RegionOption(
                id=record.id,
                provinceName=record.province_name,
                cityName=record.city_name,
                districtName=record.district_name,
                longitude=record.longitude,
            )
            for record in self._region_catalog.list_regions()
        ]

    def build_birth_chart(self, request: BirthChartRequest) -> BirthChartApiResponse:
        return self.build_computed_birth_chart(request).response

    def build_computed_birth_chart(self, request: BirthChartRequest) -> ComputedBirthChart:
        region = self._region_catalog.get_by_id(request.regionId)
        if region is None:
            raise ChartRequestError(f"地区不存在: {request.regionId}")

        try:
            result = calculate_birth_chart(
                date_input=request.birthDate,
                time_input=request.birthTime,
                gender=request.gender,
                region_selection=RegionSelection(
                    province_name=region.province_name,
                    city_name=region.city_name,
                    district_name=region.district_name,
                    longitude=region.longitude,
                ),
            )
        except ValueError as exc:
            raise ChartRequestError(str(exc)) from exc

        summary = ResultSummaryViewModel(
            name=request.name,
            gender=result["gender"],
            inputBirthDate=result["input_birth_date"],
            inputBirthTime=result["input_birth_time"],
            regionText=" ".join([region.province_name, region.city_name, region.district_name]),
            trueSolarDatetimeText=self._format_datetime(result["solar_time"]["true_solar_datetime"]),
            trueSolarShichen=result["true_solar_shichen"],
            ziHourType=result["zi_hour_type"],
        )

        cases = [
            self._build_case(case_index, case_data)
            for case_index, case_data in enumerate(result["cases"])
        ]
        banners = self._build_banners(result)
        response = BirthChartApiResponse(summary=summary, banners=banners, cases=cases)
        return ComputedBirthChart(response=response, region=region, raw_result=result)

    def _build_case(self, case_index: int, case_data: dict) -> ApiCaseViewModel:
        case_result = case_data["result"]
        metrics = CaseMetricsViewModel(
            solarBirthday=case_result["solar_birthday"],
            lunarBirthday=case_result["lunar_birthday"],
            lunarBirthdayDisplay=self._format_lunar_birthday_display(
                case_result["lunar_birthday"], case_result["lunar_is_leap_month"]
            ),
            age=case_result["age"],
            trueSolarShichen=case_result["true_solar_shichen"],
            lunarIsLeapMonth=case_result["lunar_is_leap_month"],
        )
        yang_digit_string, yang_missing_digits = case_result["solar"]
        yin_digit_string, yin_missing_digits = case_result["lunar"]
        solar_profile = self._build_chart_profile(
            chart_type="yang",
            year_month_day=case_result["solar_date"],
            digit_string=yang_digit_string,
            missing_digits=yang_missing_digits,
            base_digits=case_result["solar_base_digits"],
            suffix_digits=case_result["solar_suffix_digits"],
            half_supplement=case_result["half_supplement"],
            missing_attributes=case_result["solar_attributes"],
            missing_count=case_result["solar_missing_count"],
        )
        lunar_calc = calc_nine_grid(
            *case_result["lunar_date"],
            extra_prefix="1" if case_result["lunar_is_leap_month"] else "",
        )
        lunar_main_soul_source = calculate_main_soul_source(
            lunar_calc["base_digits"], lunar_calc["suffix_digits"]
        )
        lunar_main_soul = calculate_main_soul(lunar_calc["base_digits"], lunar_calc["suffix_digits"])
        lunar_po = calculate_po(
            self._tuple_to_datetime_compatible_date(case_result["lunar_date"])
        )
        lunar_profile = self._build_chart_profile(
            chart_type="yin",
            year_month_day=case_result["lunar_date"],
            digit_string=yin_digit_string,
            missing_digits=yin_missing_digits,
            base_digits=lunar_calc["base_digits"],
            suffix_digits=lunar_calc["suffix_digits"],
            half_supplement=case_result["half_supplement"],
            missing_attributes=case_result["lunar_attributes"],
            missing_count=case_result["lunar_missing_count"],
            po_raw=lunar_po,
            main_soul=lunar_main_soul,
            sub_soul=calculate_sub_soul(lunar_calc["grid"], lunar_main_soul_source),
        )
        charts = ApiCaseChartsViewModel(
            yang=solar_profile,
            yin=lunar_profile,
        )
        return ApiCaseViewModel(
            index=case_index,
            label=case_data["label"],
            dateRelation=case_data["date_relation"],
            metrics=metrics,
            charts=charts,
        )

    def _build_chart_profile(
        self,
        chart_type: str,
        year_month_day: tuple[int, int, int],
        digit_string: str,
        missing_digits: str,
        base_digits: str,
        suffix_digits: str,
        half_supplement: str,
        missing_attributes: str,
        missing_count: int,
        po_raw: str | None = None,
        main_soul: str | None = None,
        sub_soul: str | None = None,
    ) -> GridBoardViewModel:
        profile_po_raw = po_raw or calculate_po(self._tuple_to_datetime_compatible_date(year_month_day))
        profile_po = self._dedupe_digits(profile_po_raw)
        profile_main_soul = main_soul or calculate_main_soul(base_digits, suffix_digits)
        main_soul_source = calculate_main_soul_source(base_digits, suffix_digits)
        profile_sub_soul = sub_soul or calculate_sub_soul(digit_string, main_soul_source)
        main_soul_digits = self._dedupe_digits(profile_main_soul)
        main_soul_frequency = {digit: 1 for digit in main_soul_digits}
        sub_soul_frequency = self._build_frequency_map(profile_sub_soul)
        po_frequency = self._build_frequency_map(profile_po_raw)
        cells: list[GridCellViewModel] = []

        for index, cell_number in enumerate(CELL_LAYOUT):
            if cell_number is None:
                cells.append(
                    GridCellViewModel(
                        id=f"placeholder-{index}",
                        cellNumber=None,
                        centerDigit="",
                        isPlaceholder=True,
                        count=0,
                        isMainSoul=False,
                        isSubSoul=False,
                        isPo=False,
                        isMissing=False,
                        mainSoulCount=0,
                        subSoulCount=0,
                        poCount=0,
                        hasMissing=False,
                        markers=[],
                    )
                )
                continue

            digit = str(cell_number)
            cells.append(
                GridCellViewModel(
                    id=f"cell-{cell_number}",
                    cellNumber=cell_number,
                    centerDigit=digit,
                    isPlaceholder=False,
                    count=digit_string.count(digit),
                    isMainSoul=digit in main_soul_digits,
                    isSubSoul=digit in profile_sub_soul,
                    isPo=digit in profile_po,
                    isMissing=digit in missing_digits,
                    mainSoulCount=main_soul_frequency.get(digit, 0),
                    subSoulCount=sub_soul_frequency.get(digit, 0),
                    poCount=po_frequency.get(digit, 0),
                    hasMissing=digit in missing_digits,
                    markers=[],
                )
            )

        return GridBoardViewModel(
            chartType=chart_type,
            digitString=digit_string,
            missingDigits=missing_digits,
            missingAttributes=missing_attributes,
            missingCount=missing_count,
            po=profile_po,
            poRaw=profile_po_raw,
            mainSoul=profile_main_soul,
            subSoul=profile_sub_soul,
            halfSupplement=half_supplement,
            cells=cells,
        )

    @staticmethod
    def _build_banners(result: dict) -> list[BannerViewModel]:
        banners: list[BannerViewModel] = []
        if result["zi_hour_type"] != "非子时":
            banners.append(ZI_HOUR_BANNER)
        if any(case["result"]["lunar_is_leap_month"] for case in result["cases"]):
            banners.append(LUNAR_LEAP_BANNER)
        return banners

    @staticmethod
    def _build_frequency_map(source: str) -> dict[str, int]:
        return dict(Counter(source))

    @staticmethod
    def _dedupe_digits(source: str) -> str:
        return "".join(dict.fromkeys(source))

    @staticmethod
    def _format_datetime(value: datetime) -> str:
        return value.strftime("%Y-%m-%d %H:%M:%S")

    @staticmethod
    def _format_lunar_birthday_display(lunar_birthday: str, is_leap_month: bool) -> str:
        year_text, month_text, day_text = lunar_birthday.split("-")
        month_label = f"闰{int(month_text)}月" if is_leap_month else f"{int(month_text)}月"
        return f"{year_text}年{month_label}{int(day_text)}日"

    @staticmethod
    def _tuple_to_datetime_compatible_date(value: tuple[int, int, int]) -> datetime:
        year, month, day = value
        return datetime(year, month, day)
