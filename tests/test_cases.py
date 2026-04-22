from __future__ import annotations

import sys
from datetime import date, datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from nine_grid import (  # noqa: E402
    RegionSelection,
    calculate_age,
    calculate_birth_chart,
    calculate_half_supplement,
    calculate_main_soul,
    calculate_po,
    calculate_sub_soul,
    calculate_true_solar_shichen,
    format_lunar_birthday,
    format_solar_birthday,
)

REFERENCE_DATETIME = datetime(2026, 4, 22, 12, 0, 0)

TEST_CASES = [
    {
        "name": "普通日期案例",
        "args": (
            "1999-10-11",
            "06:00",
            "男",
            RegionSelection("新疆维吾尔自治区", "乌鲁木齐市", "头屯河区", 87.42),
        ),
        "expected_shichen": "寅",
        "expected_half_supplement": "45",
        "expected_zi_hour_type": "非子时",
        "expected_case_count": 1,
        "expected_special_labels": [],
        "expected_cases": [
            {
                "label": "第一套",
                "date_relation": "当前日期",
                "solar_birthday": "1999-10-11",
                "lunar_birthday": "1999-09-03",
                "age": 26,
                "po": "01111999",
                "main_soul": "4",
                "sub_soul": "1931",
                "solar": ("19314", "25678"),
                "lunar": ("9404", "25678"),
                "solar_attributes": "金、木、水、土",
                "solar_missing_count": 4,
                "lunar_attributes": "金、木、水、土",
                "lunar_missing_count": 4,
                "base_digits": "314",
                "prefix_digits": "19",
                "suffix_digits": "",
                "solar_date": (1999, 10, 11),
                "lunar_raw_grid": "9404",
                "lunar_is_leap_month": False,
            }
        ],
    },
    {
        "name": "2000年后案例",
        "args": (
            "2024-03-10",
            "14:20",
            "女",
            RegionSelection("北京市", "北京市", "朝阳区", 116.443205),
        ),
        "expected_shichen": "未",
        "expected_half_supplement": "789",
        "expected_zi_hour_type": "非子时",
        "expected_case_count": 1,
        "expected_special_labels": [],
        "expected_cases": [
            {
                "label": "第一套",
                "date_relation": "当前日期",
                "solar_birthday": "2024-03-10",
                "lunar_birthday": "2024-02-01",
                "age": 2,
                "po": "00012234",
                "main_soul": "3",
                "sub_soul": "012",
                "solar": ("0123", "56789"),
                "lunar": ("02112", "356789"),
                "solar_attributes": "木、水、土",
                "solar_missing_count": 3,
                "lunar_attributes": "木、水、火、土",
                "lunar_missing_count": 4,
                "base_digits": "123",
                "prefix_digits": "0",
                "suffix_digits": "",
                "solar_date": (2024, 3, 10),
                "lunar_raw_grid": "02112",
                "lunar_is_leap_month": False,
            }
        ],
    },
    {
        "name": "农历闰月案例",
        "args": (
            "2020-05-23",
            "12:00",
            "男",
            RegionSelection("浙江省", "杭州市", "西湖区", 120.126897),
        ),
        "expected_shichen": "午",
        "expected_half_supplement": "3",
        "expected_zi_hour_type": "非子时",
        "expected_case_count": 1,
        "expected_special_labels": ["农历闰月"],
        "expected_cases": [
            {
                "label": "第一套",
                "date_relation": "当前日期",
                "solar_birthday": "2020-05-23",
                "lunar_birthday": "2020-04-01",
                "age": 5,
                "po": "00022235",
                "main_soul": "5",
                "sub_soul": "0214",
                "solar": ("02145", "6789"),
                "lunar": ("104419", "35678"),
                "solar_attributes": "水、土",
                "solar_missing_count": 2,
                "lunar_attributes": "木、水、火、土",
                "lunar_missing_count": 4,
                "base_digits": "145",
                "prefix_digits": "02",
                "suffix_digits": "",
                "solar_date": (2020, 5, 23),
                "lunar_raw_grid": "104419",
                "lunar_is_leap_month": True,
            }
        ],
    },
    {
        "name": "农历闰月前补参与后置案例",
        "args": (
            "2014-11-03",
            "12:00",
            "男",
            RegionSelection("北京市", "北京市", "朝阳区", 116.443205),
        ),
        "expected_shichen": "午",
        "expected_half_supplement": "3",
        "expected_zi_hour_type": "非子时",
        "expected_case_count": 1,
        "expected_special_labels": ["农历闰月"],
        "expected_cases": [
            {
                "label": "第一套",
                "date_relation": "当前日期",
                "solar_birthday": "2014-11-03",
                "lunar_birthday": "2014-09-11",
                "age": 11,
                "po": "00111234",
                "main_soul": "3",
                "sub_soul": "112",
                "solar": ("1123", "56789"),
                "lunar": ("111891", "3567"),
                "solar_attributes": "木、水、土",
                "solar_missing_count": 3,
                "lunar_attributes": "木、水、火、土",
                "lunar_missing_count": 4,
                "base_digits": "123",
                "prefix_digits": "1",
                "suffix_digits": "",
                "solar_date": (2014, 11, 3),
                "lunar_raw_grid": "111891",
                "lunar_is_leap_month": True,
            }
        ],
    },
    {
        "name": "前子时案例",
        "args": (
            "2013-06-05",
            "23:35",
            "女",
            RegionSelection("浙江省", "杭州市", "西湖区", 120.126897),
        ),
        "expected_shichen": "子",
        "expected_half_supplement": "06",
        "expected_zi_hour_type": "前子时",
        "expected_case_count": 2,
        "expected_special_labels": ["前子时"],
        "expected_cases": [
            {
                "label": "第一套",
                "date_relation": "当天",
                "solar_birthday": "2013-06-05",
                "lunar_birthday": "2013-04-27",
                "age": 12,
                "po": "00012356",
                "main_soul": "8",
                "sub_soul": "017",
                "solar": ("0178", "49"),
                "lunar": ("19101", "568"),
                "solar_attributes": "木、土",
                "solar_missing_count": 2,
                "lunar_attributes": "木、水、土",
                "lunar_missing_count": 3,
                "base_digits": "178",
                "prefix_digits": "0",
                "suffix_digits": "",
                "solar_date": (2013, 6, 5),
                "lunar_raw_grid": "19101",
                "lunar_is_leap_month": False,
            },
            {
                "label": "第二套",
                "date_relation": "后一天",
                "solar_birthday": "2013-06-06",
                "lunar_birthday": "2013-04-28",
                "age": 12,
                "po": "00012366",
                "main_soul": "9",
                "sub_soul": "018",
                "solar": ("0189", "457"),
                "lunar": ("202", "5679"),
                "solar_attributes": "木、土",
                "solar_missing_count": 2,
                "lunar_attributes": "木、水、土",
                "lunar_missing_count": 3,
                "base_digits": "189",
                "prefix_digits": "0",
                "suffix_digits": "",
                "solar_date": (2013, 6, 6),
                "lunar_raw_grid": "202",
                "lunar_is_leap_month": False,
            },
        ],
    },
    {
        "name": "后子时案例",
        "args": (
            "2014-07-08",
            "00:16",
            "男",
            RegionSelection("浙江省", "杭州市", "西湖区", 120.126897),
        ),
        "expected_shichen": "子",
        "expected_half_supplement": "06",
        "expected_zi_hour_type": "后子时",
        "expected_case_count": 2,
        "expected_special_labels": ["后子时"],
        "expected_cases": [
            {
                "label": "第一套",
                "date_relation": "当天",
                "solar_birthday": "2014-07-08",
                "lunar_birthday": "2014-06-12",
                "age": 11,
                "po": "00012478",
                "main_soul": "4",
                "sub_soul": "022",
                "solar": ("0224", "3569"),
                "lunar": ("167", "3589"),
                "solar_attributes": "木、水、火、土",
                "solar_missing_count": 4,
                "lunar_attributes": "木、火、土",
                "lunar_missing_count": 3,
                "base_digits": "224",
                "prefix_digits": "0",
                "suffix_digits": "",
                "solar_date": (2014, 7, 8),
                "lunar_raw_grid": "167",
                "lunar_is_leap_month": False,
            },
            {
                "label": "第二套",
                "date_relation": "前一天",
                "solar_birthday": "2014-07-07",
                "lunar_birthday": "2014-06-11",
                "age": 11,
                "po": "00012477",
                "main_soul": "3",
                "sub_soul": "021",
                "solar": ("0213", "5689"),
                "lunar": ("1156", "3789"),
                "solar_attributes": "木、水、土",
                "solar_missing_count": 3,
                "lunar_attributes": "火、土",
                "lunar_missing_count": 2,
                "base_digits": "213",
                "prefix_digits": "0",
                "suffix_digits": "",
                "solar_date": (2014, 7, 7),
                "lunar_raw_grid": "1156",
                "lunar_is_leap_month": False,
            },
        ],
    },
    {
        "name": "主魂后置数字案例",
        "args": (
            "1910-08-19",
            "12:00",
            "男",
            RegionSelection("北京市", "北京市", "朝阳区", 116.443205),
        ),
        "expected_shichen": "午",
        "expected_half_supplement": "3",
        "expected_zi_hour_type": "非子时",
        "expected_case_count": 1,
        "expected_special_labels": [],
        "expected_cases": [
            {
                "label": "第一套",
                "date_relation": "当前日期",
                "solar_birthday": "1910-08-19",
                "lunar_birthday": "1910-07-15",
                "age": 115,
                "po": "00111899",
                "main_soul": "21",
                "sub_soul": "12911",
                "solar": ("1291121", "34567"),
                "lunar": ("1246", "38"),
                "solar_attributes": "木、水、火、土",
                "solar_missing_count": 4,
                "lunar_attributes": "火、土",
                "lunar_missing_count": 2,
                "base_digits": "29112",
                "prefix_digits": "1",
                "suffix_digits": "1",
                "solar_date": (1910, 8, 19),
                "lunar_raw_grid": "1246",
                "lunar_is_leap_month": False,
            }
        ],
    },
]

BOUNDARY_CASES = [
    {
        "name": "最小支持日期",
        "args": (
            "1910-01-01",
            "12:00",
            "男",
            RegionSelection("北京市", "北京市", "朝阳区", 116.443205),
        ),
    },
    {
        "name": "最大支持日期",
        "args": (
            "2070-12-31",
            "12:00",
            "女",
            RegionSelection("北京市", "北京市", "朝阳区", 116.443205),
        ),
    },
]

INVALID_BOUNDARY_CASES = [
    ("1909-12-31", "12:00", "男", RegionSelection("北京市", "北京市", "朝阳区", 116.443205)),
    ("2071-01-01", "12:00", "女", RegionSelection("北京市", "北京市", "朝阳区", 116.443205)),
]


def assert_equal(case_name: str, label: str, actual, expected) -> None:
    if actual != expected:
        raise AssertionError(
            f"{case_name} 失败: {label} 不符合预期。actual={actual!r}, expected={expected!r}"
        )


def run_case(case: dict) -> None:
    result = calculate_birth_chart(*case["args"], reference_datetime=REFERENCE_DATETIME)
    assert result["solar_time"]["true_solar_datetime"] is not None

    assert_equal(case["name"], "性别", result["gender"], case["args"][2])
    assert_equal(case["name"], "真太阳时辰", result["true_solar_shichen"], case["expected_shichen"])
    assert_equal(case["name"], "半补", result["half_supplement"], case["expected_half_supplement"])
    assert_equal(case["name"], "子时类型", result["zi_hour_type"], case["expected_zi_hour_type"])
    assert_equal(case["name"], "方案数量", len(result["cases"]), case["expected_case_count"])

    special_labels = [item["label"] for item in result["special_types"]]
    assert_equal(case["name"], "特殊类型", special_labels, case["expected_special_labels"])

    actual_case_dates = [item["result"]["solar_date"] for item in result["cases"]]
    expected_case_dates = [item["solar_date"] for item in case["expected_cases"]]
    assert_equal(case["name"], "方案日期", actual_case_dates, expected_case_dates)

    for index, (case_item, expected_case) in enumerate(
        zip(result["cases"], case["expected_cases"], strict=True),
        start=1,
        ):
        case_name = f"{case['name']}#{index}"
        payload = case_item["result"]

        assert_equal(case_name, "方案标签", case_item["label"], expected_case["label"])
        assert_equal(case_name, "日期关系", case_item["date_relation"], expected_case["date_relation"])
        assert_equal(case_name, "阳历生日", payload["solar_birthday"], expected_case["solar_birthday"])
        assert_equal(case_name, "农历生日", payload["lunar_birthday"], expected_case["lunar_birthday"])
        assert_equal(case_name, "年龄", payload["age"], expected_case["age"])
        assert_equal(case_name, "魄", payload["po"], expected_case["po"])
        assert_equal(case_name, "主魂", payload["main_soul"], expected_case["main_soul"])
        assert_equal(case_name, "副魂", payload["sub_soul"], expected_case["sub_soul"])
        assert_equal(case_name, "阳格结果", payload["solar"], expected_case["solar"])
        assert_equal(case_name, "阴格结果", payload["lunar"], expected_case["lunar"])
        assert_equal(case_name, "阳格缺失属性", payload["solar_attributes"], expected_case["solar_attributes"])
        assert_equal(case_name, "阳格缺门数", payload["solar_missing_count"], expected_case["solar_missing_count"])
        assert_equal(case_name, "阴格缺失属性", payload["lunar_attributes"], expected_case["lunar_attributes"])
        assert_equal(case_name, "阴格缺门数", payload["lunar_missing_count"], expected_case["lunar_missing_count"])
        assert_equal(case_name, "基础串", payload["solar_base_digits"], expected_case["base_digits"])
        assert_equal(case_name, "前置追加数字", payload["solar_prefix_digits"], expected_case["prefix_digits"])
        assert_equal(case_name, "后置追加数字", payload["solar_suffix_digits"], expected_case["suffix_digits"])
        assert_equal(case_name, "阴格原始串", payload["lunar_raw_grid"], expected_case["lunar_raw_grid"])
        assert_equal(
            case_name, "农历闰月标记", payload["lunar_is_leap_month"], expected_case["lunar_is_leap_month"]
        )
        assert_equal(case_name, "方案半补", payload["half_supplement"], case["expected_half_supplement"])
        assert_equal(case_name, "方案时辰", payload["true_solar_shichen"], case["expected_shichen"])

        if payload["lunar_is_leap_month"]:
            assert payload["lunar"][0].startswith("1")


def run_interface_checks() -> None:
    assert_equal("接口", "魄", calculate_po(date(1999, 10, 11)), "01111999")
    assert_equal("接口", "主魂-无后置", calculate_main_soul("314", ""), "4")
    assert_equal("接口", "主魂-有后置", calculate_main_soul("29112", "1"), "21")
    assert_equal("接口", "主魂-重复保留", calculate_main_soul("19101", "1"), "11")
    assert_equal("接口", "副魂", calculate_sub_soul("19314", "4"), "1931")
    assert_equal("接口", "副魂", calculate_sub_soul("9404", "4"), "940")
    assert_equal("接口", "副魂", calculate_sub_soul("1291121", "21"), "12911")
    assert_equal("接口", "年龄", calculate_age(date(1999, 10, 11), REFERENCE_DATETIME), 26)
    assert_equal("接口", "半补", calculate_half_supplement("子"), "06")
    assert_equal(
        "接口",
        "真太阳时辰",
        calculate_true_solar_shichen(datetime(2026, 4, 22, 23, 10, 0)),
        "子",
    )
    assert_equal("接口", "阳历生日格式化", format_solar_birthday(date(2024, 3, 10)), "2024-03-10")
    assert_equal("接口", "农历生日格式化", format_lunar_birthday((2020, 4, 1, True)), "2020-04-01")


def main() -> None:
    for case in TEST_CASES:
        run_case(case)
        print(f"[PASS] {case['name']}")

    run_interface_checks()
    print("[PASS] 独立接口检查")

    for case in BOUNDARY_CASES:
        calculate_birth_chart(*case["args"], reference_datetime=REFERENCE_DATETIME)
        print(f"[PASS] {case['name']}")

    for args in INVALID_BOUNDARY_CASES:
        try:
            calculate_birth_chart(*args, reference_datetime=REFERENCE_DATETIME)
        except ValueError as exc:
            assert "1910-01-01" in str(exc)
            assert "2070-12-31" in str(exc)
        else:
            raise AssertionError(f"边界校验失败: {args[0]} 应当报错")
    print("[PASS] 日期边界限制")

    total_cases = len(TEST_CASES) + len(BOUNDARY_CASES) + 2
    print(f"\n共 {total_cases} 组测试，全部通过。")


if __name__ == "__main__":
    main()
