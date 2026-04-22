from __future__ import annotations

from .calculator import calculate_birth_chart
from .region_data import RegionRepository


def main() -> None:
    repository = RegionRepository()
    print("=== 九宫格单人出生测算工具 ===")
    print("请输入公历生日、出生时间、性别，并按编号选择省、市、区/县。")
    print("支持日期格式: YYYYMMDD, YYYY/MM/DD, YYYY.MM.DD, YYYY-MM-DD")
    print("出生时间（格式 HH:MM，例如 06:00）")
    print("输入 exit 或 quit 可退出。")
    print()

    while True:
        try:
            birth_date = input("公历出生日期: ").strip()
            if birth_date.lower() in {"exit", "quit"}:
                print("已退出程序。")
                break

            birth_time = input("出生时间（格式 HH:MM，例如 06:00）: ").strip()
            if birth_time.lower() in {"exit", "quit"}:
                print("已退出程序。")
                break

            gender = input("请输入性别: ").strip()
            if gender.lower() in {"exit", "quit"}:
                print("已退出程序。")
                break

            province_index = prompt_index("请选择省份：", repository.list_provinces())
            city_index = prompt_index("请选择城市：", repository.list_cities(province_index))
            district_index = prompt_index(
                "请选择区/县：",
                repository.list_districts(province_index, city_index),
            )

            selection = repository.build_region_selection(
                province_index, city_index, district_index
            )
            result = calculate_birth_chart(birth_date, birth_time, gender, selection)
            print_birth_chart(result)
        except SystemExit:
            print("已退出程序。")
            break
        except Exception as exc:
            print(f"\n错误: {exc}\n")


def prompt_index(title: str, items: list[dict]) -> int:
    while True:
        print(title)
        for index, item in enumerate(items, start=1):
            print(f"{index}. {item['name']}")
        raw = input("请输入编号: ").strip()
        if raw.lower() in {"exit", "quit"}:
            raise SystemExit
        if not raw.isdigit():
            print("输入无效，请输入数字编号。\n")
            continue

        value = int(raw) - 1
        if 0 <= value < len(items):
            print()
            return value

        print("编号超出范围，请重新输入。\n")


def print_birth_chart(result: dict) -> None:
    solar_time = result["solar_time"]
    region_path = " - ".join(
        [
            result["input"]["province_name"],
            result["input"]["city_name"],
            result["input"]["district_name"],
        ]
    )

    print("\n=== 测算结果 ===")
    print(f"性别: {result['gender']}")
    print(f"输入北京时间: {format_datetime(result['input']['beijing_datetime'])}")
    print(f"地区: {region_path}（经度 {result['input']['longitude']:.6f}）")
    print(f"真太阳时: {format_datetime(solar_time['true_solar_datetime'])}")
    print(f"经度时间差: {format_offset(solar_time['longitude_offset_seconds'])}")
    print(f"均时差: {format_offset(solar_time['equation_of_time_seconds'])}")
    print(f"真太阳时辰: {result['true_solar_shichen']}时")
    print(f"半补: {result['half_supplement']}")
    print(f"子时类型: {result['zi_hour_type']}")
    print(f"特殊类型: {format_special_types(result['special_types'])}")
    print()

    for case in result["cases"]:
        print_case(case)
        print()


def print_case(case: dict) -> None:
    result = case["result"]
    leap_note = "（闰月）" if result["lunar_is_leap_month"] else ""

    print(f"{case['label']} - {case['date_relation']}")
    print(f"  阳历生日: {result['solar_birthday']}")
    print(f"  农历生日: {result['lunar_birthday']}{leap_note}")
    print(f"  年龄: {result['age']}")
    print(f"  魄: {result['po']}")
    print(f"  主魂: {result['main_soul']}")
    print(f"  副魂: {result['sub_soul']}")
    print(f"  半补: {result['half_supplement']}")
    print(f"  真太阳时辰: {result['true_solar_shichen']}时")
    print(
        f"  阳格: {result['solar'][0]} / 缺数: {result['solar'][1]} / 缺门数: {result['solar_missing_count']}"
    )
    print(
        f"  阴格: {result['lunar'][0]} / 缺数: {result['lunar'][1]} / 缺门数: {result['lunar_missing_count']}"
    )
    if case["special_types"]:
        print(f"  方案特殊类型: {format_special_types(case['special_types'])}")


def format_datetime(target_datetime) -> str:
    return target_datetime.strftime("%Y-%m-%d %H:%M:%S")


def format_offset(total_seconds: int) -> str:
    sign = "-" if total_seconds < 0 else ""
    total_seconds = abs(total_seconds)
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{sign}{hours}小时{minutes}分钟{seconds}秒"


def format_special_types(special_types: list[dict]) -> str:
    if not special_types:
        return "无"
    return "；".join(
        f"{item['label']}（{item['description']}）" for item in special_types
    )
