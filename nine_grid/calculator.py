# input: 出生信息、地区经度、核心模型与地区数据。
# output: 九宫格计算结果与中间派生值。
# pos: 独立算法包的计算核心。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

from collections import Counter
from datetime import date, datetime, time, timedelta
from math import cos, pi, sin

from lunardate import LunarDate

from .models import RegionSelection

MIN_SUPPORTED_DATE = date(1910, 1, 1)
MAX_SUPPORTED_DATE = date(2070, 12, 31)
BEIJING_STANDARD_LONGITUDE = 120.0

HALF_SUPPLEMENT_BY_BRANCH = {
    "子": "06",
    "丑": "789",
    "寅": "45",
    "卯": "45",
    "辰": "789",
    "巳": "3",
    "午": "3",
    "未": "789",
    "申": "12",
    "酉": "12",
    "戌": "789",
    "亥": "06",
}

SPECIAL_TYPE_INFO = {
    "前子时": "真太阳时落在 23:00-00:00，需同时参考当天与后一天结果",
    "后子时": "真太阳时落在 00:00-01:00，需同时参考当天与前一天结果",
    "农历闰月": "对应农历为闰月，阴历九宫格展示前补 1",
}

ATTRIBUTE_MAP = {
    "1": "金",
    "2": "金",
    "4": "木",
    "5": "木",
    "0": "水",
    "6": "水",
    "3": "火",
    "7": "土",
    "8": "土",
    "9": "土",
}
ATTRIBUTE_ORDER = ["金", "木", "水", "火", "土"]


def calculate_birth_chart(
    date_input: str,
    time_input: str,
    gender: str,
    region_selection: RegionSelection,
    reference_datetime: datetime | None = None,
) -> dict:
    birth_date = parse_birth_date(date_input)
    birth_time = parse_birth_time(time_input)
    normalized_gender = parse_gender(gender)
    beijing_datetime = datetime.combine(birth_date, birth_time)

    solar_time = calc_true_solar_time(beijing_datetime, region_selection.longitude)
    true_solar_datetime = solar_time["true_solar_datetime"]
    true_solar_shichen = calculate_true_solar_shichen(true_solar_datetime)
    half_supplement = calculate_half_supplement(true_solar_shichen)
    zi_hour_type = determine_zi_hour_type(true_solar_datetime)

    cases = []
    for case_label, date_relation, target_date in resolve_target_dates(birth_date, zi_hour_type):
        day_result = build_day_result(target_date, true_solar_shichen, reference_datetime)
        case_special_types = []
        if day_result["lunar_is_leap_month"]:
            case_special_types.append(
                {
                    "label": "农历闰月",
                    "description": SPECIAL_TYPE_INFO["农历闰月"],
                }
            )
        cases.append(
            {
                "label": case_label,
                "date_relation": date_relation,
                "result": day_result,
                "special_types": case_special_types,
            }
        )

    return {
        "input": {
            "gender": normalized_gender,
            "birth_date": birth_date.isoformat(),
            "birth_time": birth_time.strftime("%H:%M"),
            "beijing_datetime": beijing_datetime,
            "province_name": region_selection.province_name,
            "city_name": region_selection.city_name,
            "district_name": region_selection.district_name,
            "longitude": region_selection.longitude,
        },
        "gender": normalized_gender,
        "input_birth_date": birth_date.isoformat(),
        "input_birth_time": birth_time.strftime("%H:%M"),
        "solar_time": solar_time,
        "true_solar_shichen": true_solar_shichen,
        "shichen": true_solar_shichen,
        "half_supplement": half_supplement,
        "zi_hour_type": zi_hour_type,
        "special_types": build_special_types(zi_hour_type, cases),
        "cases": cases,
    }


def parse_gender(gender_input: str) -> str:
    text = str(gender_input).strip()
    if not text:
        raise ValueError("性别不能为空。")
    return text


def parse_birth_date(date_input: str) -> date:
    text = str(date_input).strip()
    if text.isdigit() and len(text) == 8:
        parsed = date(int(text[:4]), int(text[4:6]), int(text[6:8]))
    else:
        parsed = None
        for separator in ("/", ".", "-"):
            if separator in text:
                parts = text.split(separator)
                if len(parts) == 3:
                    parsed = date(int(parts[0]), int(parts[1]), int(parts[2]))
                    break
        if parsed is None:
            raise ValueError(f"无法解析日期: {date_input}")

    validate_supported_date(parsed)
    return parsed


def validate_supported_date(target_date: date) -> None:
    if not (MIN_SUPPORTED_DATE <= target_date <= MAX_SUPPORTED_DATE):
        raise ValueError("日期超出支持范围，仅支持 1910-01-01 到 2070-12-31。")


def parse_birth_time(time_input: str) -> time:
    text = str(time_input).strip()
    parts = text.split(":")
    if len(parts) != 2:
        raise ValueError(f"无法解析时间: {time_input}，请输入 HH:MM 格式。")

    hour = int(parts[0])
    minute = int(parts[1])
    if hour < 0 or hour > 23 or minute < 0 or minute > 59:
        raise ValueError(f"时间超出范围: {time_input}，请输入 HH:MM 格式。")

    return time(hour, minute)


def date_to_8_digits(year: int, month: int, day: int) -> list[int]:
    return list(map(int, f"{year:04d}{month:02d}{day:02d}"))


def calculate_po(target_date: date) -> str:
    digits = date_to_8_digits(target_date.year, target_date.month, target_date.day)
    return "".join(str(number) for number in sorted(digits))


def calc_chain_sum_digits(digits: list[int]) -> str:
    result = []
    current_sum = sum(digits)
    original_sum = current_sum

    while True:
        current_text = str(current_sum)
        result.append(current_text)
        if len(current_text) == 1:
            break
        current_sum = sum(map(int, current_text))

    if original_sum <= 10:
        year_sum = str(sum(digits[0:4]))
        month_sum = str(sum(digits[4:6]))
        day_sum = str(sum(digits[6:8]))
        result = [year_sum, month_sum, day_sum] + result

    return "".join(result)


def apply_triple_rule(origin_digits: list[int], base_str: str, extra_prefix: str = "") -> dict:
    counter = Counter(origin_digits)
    prefix = "".join(str(num) * (counter[num] // 3) for num in sorted(counter.keys()))
    intermediate = extra_prefix + prefix + base_str
    suffix_counter = Counter(intermediate[:-1])
    suffix = "".join(
        str(num) * (suffix_counter[num] // 3) for num in sorted(suffix_counter.keys())
    )
    return {
        "prefix_digits": prefix,
        "base_digits": base_str,
        "suffix_digits": suffix,
        "grid": intermediate + suffix,
    }


def calculate_main_soul(base_digits: str, suffix_digits: str) -> str:
    return calculate_main_soul_source(base_digits, suffix_digits)


def calculate_main_soul_source(base_digits: str, suffix_digits: str) -> str:
    return base_digits[-1] + suffix_digits if suffix_digits else base_digits[-1]


def calculate_sub_soul(final_digits: str, main_soul_source: str) -> str:
    if main_soul_source and final_digits.endswith(main_soul_source):
        return final_digits[: -len(main_soul_source)]
    return final_digits


def calc_missing_numbers(origin_digits: list[int], grid_str: str) -> str:
    all_digits = set(origin_digits + list(map(int, grid_str)))
    return "".join(str(number) for number in range(10) if number not in all_digits)


def calc_missing_attributes(missing_numbers: str) -> tuple[str, int]:
    attributes = {ATTRIBUTE_MAP[number] for number in missing_numbers}
    ordered = [attribute for attribute in ATTRIBUTE_ORDER if attribute in attributes]
    return "、".join(ordered), len(ordered)


def calc_nine_grid(year: int, month: int, day: int, extra_prefix: str = "") -> dict:
    origin_digits = date_to_8_digits(year, month, day)
    base = calc_chain_sum_digits(origin_digits)
    triple_result = apply_triple_rule(origin_digits, base, extra_prefix=extra_prefix)
    grid = triple_result["grid"]
    missing = calc_missing_numbers(origin_digits, grid)
    return {
        "origin_digits": origin_digits,
        "base_digits": base,
        "prefix_digits": triple_result["prefix_digits"],
        "suffix_digits": triple_result["suffix_digits"],
        "grid": grid,
        "missing": missing,
    }


def solar_to_lunar_detail(year: int, month: int, day: int) -> tuple[int, int, int, bool]:
    lunar = LunarDate.fromSolarDate(year, month, day)
    return lunar.year, lunar.month, lunar.day, bool(lunar.isLeapMonth)


def format_solar_birthday(target_date: date) -> str:
    return target_date.strftime("%Y-%m-%d")


def format_lunar_birthday(lunar_detail: tuple[int, int, int, bool]) -> str:
    year, month, day, _ = lunar_detail
    return f"{year:04d}-{month:02d}-{day:02d}"


def calculate_age(birth_date: date, reference_datetime: datetime | None = None) -> int:
    reference_date = (reference_datetime or datetime.now()).date()
    years = reference_date.year - birth_date.year
    if (reference_date.month, reference_date.day) < (birth_date.month, birth_date.day):
        years -= 1
    return years


def build_day_result(
    target_date: date,
    true_solar_shichen: str,
    reference_datetime: datetime | None = None,
) -> dict:
    solar_result = calc_nine_grid(target_date.year, target_date.month, target_date.day)
    lunar_detail = solar_to_lunar_detail(target_date.year, target_date.month, target_date.day)
    lunar_year, lunar_month, lunar_day, is_leap_month = lunar_detail
    lunar_result = calc_nine_grid(
        lunar_year,
        lunar_month,
        lunar_day,
        extra_prefix="1" if is_leap_month else "",
    )
    solar_attributes, solar_missing_count = calc_missing_attributes(solar_result["missing"])
    lunar_attributes, lunar_missing_count = calc_missing_attributes(lunar_result["missing"])
    po = calculate_po(target_date)
    main_soul_source = calculate_main_soul_source(
        solar_result["base_digits"], solar_result["suffix_digits"]
    )
    main_soul = calculate_main_soul(solar_result["base_digits"], solar_result["suffix_digits"])
    sub_soul = calculate_sub_soul(solar_result["grid"], main_soul_source)

    return {
        "solar": (solar_result["grid"], solar_result["missing"]),
        "lunar": (lunar_result["grid"], lunar_result["missing"]),
        "solar_date": (target_date.year, target_date.month, target_date.day),
        "lunar_date": (lunar_year, lunar_month, lunar_day),
        "solar_birthday": format_solar_birthday(target_date),
        "lunar_birthday": format_lunar_birthday(lunar_detail),
        "age": calculate_age(target_date, reference_datetime),
        "po": po,
        "main_soul": main_soul,
        "sub_soul": sub_soul,
        "half_supplement": calculate_half_supplement(true_solar_shichen),
        "true_solar_shichen": true_solar_shichen,
        "solar_attributes": solar_attributes,
        "solar_missing_count": solar_missing_count,
        "lunar_attributes": lunar_attributes,
        "lunar_missing_count": lunar_missing_count,
        "lunar_is_leap_month": is_leap_month,
        "lunar_raw_grid": lunar_result["grid"],
        "solar_base_digits": solar_result["base_digits"],
        "solar_prefix_digits": solar_result["prefix_digits"],
        "solar_suffix_digits": solar_result["suffix_digits"],
    }


def calc_equation_of_time_seconds(target_date: date) -> int:
    day_of_year = target_date.timetuple().tm_yday
    gamma = 2 * pi / 365 * (day_of_year - 1)
    minutes = 229.18 * (
        0.000075
        + 0.001868 * cos(gamma)
        - 0.032077 * sin(gamma)
        - 0.014615 * cos(2 * gamma)
        - 0.040849 * sin(2 * gamma)
    )
    return round(minutes * 60)


def calc_true_solar_time(beijing_datetime: datetime, longitude: float) -> dict:
    longitude_offset_seconds = round((longitude - BEIJING_STANDARD_LONGITUDE) * 4 * 60)
    equation_of_time_seconds = calc_equation_of_time_seconds(beijing_datetime.date())
    true_solar_datetime = beijing_datetime + timedelta(
        seconds=longitude_offset_seconds + equation_of_time_seconds
    )
    return {
        "beijing_datetime": beijing_datetime,
        "true_solar_datetime": true_solar_datetime,
        "longitude_offset_seconds": longitude_offset_seconds,
        "equation_of_time_seconds": equation_of_time_seconds,
    }


def calculate_true_solar_shichen(true_solar_datetime: datetime) -> str:
    return determine_shichen(true_solar_datetime.time())


def determine_shichen(target_time: time) -> str:
    minutes = target_time.hour * 60 + target_time.minute
    if minutes >= 23 * 60 or minutes < 60:
        return "子"
    if minutes < 3 * 60:
        return "丑"
    if minutes < 5 * 60:
        return "寅"
    if minutes < 7 * 60:
        return "卯"
    if minutes < 9 * 60:
        return "辰"
    if minutes < 11 * 60:
        return "巳"
    if minutes < 13 * 60:
        return "午"
    if minutes < 15 * 60:
        return "未"
    if minutes < 17 * 60:
        return "申"
    if minutes < 19 * 60:
        return "酉"
    if minutes < 21 * 60:
        return "戌"
    return "亥"


def calculate_half_supplement(shichen: str) -> str:
    return HALF_SUPPLEMENT_BY_BRANCH[shichen]


def determine_zi_hour_type(true_solar_datetime: datetime) -> str:
    if true_solar_datetime.hour == 23:
        return "前子时"
    if true_solar_datetime.hour == 0:
        return "后子时"
    return "非子时"


def resolve_target_dates(base_date: date, zi_hour_type: str) -> list[tuple[str, str, date]]:
    if zi_hour_type == "前子时":
        return [
            ("第一套", "当天", base_date),
            ("第二套", "后一天", base_date + timedelta(days=1)),
        ]
    if zi_hour_type == "后子时":
        return [
            ("第一套", "当天", base_date),
            ("第二套", "前一天", base_date - timedelta(days=1)),
        ]
    return [("第一套", "当前日期", base_date)]


def build_special_types(zi_hour_type: str, case_results: list[dict]) -> list[dict]:
    special_types = []
    seen_labels = set()

    def append_special_type(label: str) -> None:
        if label in seen_labels:
            return
        seen_labels.add(label)
        special_types.append({"label": label, "description": SPECIAL_TYPE_INFO[label]})

    if zi_hour_type in ("前子时", "后子时"):
        append_special_type(zi_hour_type)

    if any(case["result"]["lunar_is_leap_month"] for case in case_results):
        append_special_type("农历闰月")

    return special_types
