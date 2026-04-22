from __future__ import annotations

from pathlib import Path
import sys

from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.main import app  # noqa: E402

client = TestClient(app)


def test_list_regions_returns_flattened_options() -> None:
    response = client.get("/api/v1/regions")

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert any(
        item["id"] == "北京市|北京城区|朝阳区"
        and item["provinceName"] == "北京市"
        and item["districtName"] == "朝阳区"
        for item in payload
    )
    assert any(item["id"] == "浙江省|杭州市|西湖区" for item in payload)


def test_create_chart_for_standard_case() -> None:
    response = client.post(
        "/api/v1/charts",
        json={
            "name": "林知微",
            "gender": "男",
            "birthDate": "1999-10-11",
            "birthTime": "06:00",
            "regionId": "新疆维吾尔自治区|乌鲁木齐市|头屯河区",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["trueSolarShichen"] == "寅"
    assert payload["summary"]["ziHourType"] == "非子时"
    assert payload["summary"]["trueSolarDatetimeText"] == "1999-10-11 04:03:10"
    assert payload["summary"]["regionText"] == "新疆维吾尔自治区 乌鲁木齐市 头屯河区"
    assert payload["banners"] == []
    assert len(payload["cases"]) == 1
    assert payload["cases"][0]["metrics"]["trueSolarShichen"] == "寅"
    assert payload["cases"][0]["charts"]["yang"]["digitString"] == "19314"
    assert payload["cases"][0]["charts"]["yin"]["digitString"] == "9404"
    assert payload["cases"][0]["charts"]["yang"]["mainSoul"] == "4"
    assert payload["cases"][0]["charts"]["yang"]["subSoul"] == "1931"
    assert payload["cases"][0]["charts"]["yang"]["po"] == "019"
    assert payload["cases"][0]["charts"]["yang"]["poRaw"] == "01111999"
    assert payload["cases"][0]["charts"]["yang"]["cells"][0]["poCount"] == 4
    assert payload["cases"][0]["charts"]["yang"]["halfSupplement"] == "45"
    assert payload["cases"][0]["charts"]["yang"]["missingAttributes"] == "金、木、水、土"
    assert payload["cases"][0]["charts"]["yang"]["missingCount"] == 4
    assert payload["cases"][0]["charts"]["yin"]["mainSoul"] == "4"
    assert payload["cases"][0]["charts"]["yin"]["subSoul"] == "940"
    assert payload["cases"][0]["charts"]["yin"]["po"] == "0139"
    assert payload["cases"][0]["charts"]["yin"]["poRaw"] == "00139999"
    assert payload["cases"][0]["charts"]["yin"]["halfSupplement"] == "45"
    assert payload["cases"][0]["charts"]["yin"]["missingAttributes"] == "金、木、水、土"
    assert payload["cases"][0]["charts"]["yin"]["missingCount"] == 4


def test_create_chart_for_lunar_leap_case() -> None:
    response = client.post(
        "/api/v1/charts",
        json={
            "name": "沈知夏",
            "gender": "男",
            "birthDate": "2020-05-23",
            "birthTime": "12:00",
            "regionId": "浙江省|杭州市|西湖区",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["ziHourType"] == "非子时"
    assert any(item["code"] == "lunar-leap" for item in payload["banners"])
    assert payload["cases"][0]["metrics"]["lunarIsLeapMonth"] is True
    assert payload["cases"][0]["metrics"]["lunarBirthdayDisplay"] == "2020年闰4月1日"
    assert payload["cases"][0]["charts"]["yin"]["digitString"] == "104419"
    assert payload["cases"][0]["charts"]["yang"]["subSoul"] == "0214"
    assert payload["cases"][0]["charts"]["yin"]["mainSoul"] == "9"
    assert payload["cases"][0]["charts"]["yin"]["subSoul"] == "10441"
    assert payload["cases"][0]["charts"]["yin"]["po"] == "0124"
    assert payload["cases"][0]["charts"]["yin"]["poRaw"] == "00001224"
    assert payload["cases"][0]["charts"]["yin"]["missingAttributes"] == "木、水、火、土"
    assert payload["cases"][0]["charts"]["yin"]["missingCount"] == 4


def test_create_chart_for_front_zi_case() -> None:
    response = client.post(
        "/api/v1/charts",
        json={
            "name": "许昭",
            "gender": "女",
            "birthDate": "2013-06-05",
            "birthTime": "23:35",
            "regionId": "浙江省|杭州市|西湖区",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["ziHourType"] == "前子时"
    assert any(item["code"] == "zi-hour" for item in payload["banners"])
    assert len(payload["cases"]) == 2
    assert payload["cases"][0]["dateRelation"] == "当天"
    assert payload["cases"][1]["dateRelation"] == "后一天"
    assert payload["cases"][1]["charts"]["yang"]["digitString"] == "0189"
    assert payload["cases"][0]["charts"]["yang"]["subSoul"] == "017"
    assert payload["cases"][0]["charts"]["yin"]["subSoul"] == "1910"
    assert payload["cases"][1]["charts"]["yin"]["mainSoul"] == "2"


def test_create_chart_for_back_zi_case() -> None:
    response = client.post(
        "/api/v1/charts",
        json={
            "name": "周行",
            "gender": "男",
            "birthDate": "2014-07-08",
            "birthTime": "00:16",
            "regionId": "浙江省|杭州市|西湖区",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["ziHourType"] == "后子时"
    assert any(item["code"] == "zi-hour" for item in payload["banners"])
    assert len(payload["cases"]) == 2
    assert payload["cases"][0]["dateRelation"] == "当天"
    assert payload["cases"][1]["dateRelation"] == "前一天"
    assert payload["cases"][1]["charts"]["yin"]["digitString"] == "1156"
    assert payload["cases"][0]["charts"]["yang"]["subSoul"] == "022"
    assert payload["cases"][0]["charts"]["yin"]["mainSoul"] == "7"
    assert payload["cases"][1]["charts"]["yin"]["po"] == "01246"
    assert payload["cases"][1]["charts"]["yin"]["poRaw"] == "00111246"


def test_create_chart_preserves_main_soul_order_and_single_marker_per_digit() -> None:
    response = client.post(
        "/api/v1/charts",
        json={
            "name": "秦瑾",
            "gender": "男",
            "birthDate": "1910-08-19",
            "birthTime": "12:00",
            "regionId": "北京市|北京城区|朝阳区",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    yang_chart = payload["cases"][0]["charts"]["yang"]
    assert yang_chart["mainSoul"] == "21"

    cell_one = next(item for item in yang_chart["cells"] if item["cellNumber"] == 1)
    cell_two = next(item for item in yang_chart["cells"] if item["cellNumber"] == 2)
    assert cell_one["mainSoulCount"] == 1
    assert cell_two["mainSoulCount"] == 1


def test_create_chart_counts_sub_soul_markers_from_raw_sub_soul_string() -> None:
    response = client.post(
        "/api/v1/charts",
        json={
            "name": "秦瑾",
            "gender": "男",
            "birthDate": "1910-08-19",
            "birthTime": "12:00",
            "regionId": "北京市|北京城区|朝阳区",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    yang_chart = payload["cases"][0]["charts"]["yang"]
    assert yang_chart["subSoul"] == "12911"

    cell_one = next(item for item in yang_chart["cells"] if item["cellNumber"] == 1)
    cell_two = next(item for item in yang_chart["cells"] if item["cellNumber"] == 2)
    cell_nine = next(item for item in yang_chart["cells"] if item["cellNumber"] == 9)
    assert cell_one["subSoulCount"] == 3
    assert cell_two["subSoulCount"] == 1
    assert cell_nine["subSoulCount"] == 1


def test_create_chart_for_leap_month_suffix_case() -> None:
    response = client.post(
        "/api/v1/charts",
        json={
            "name": "闰月后置案例",
            "gender": "男",
            "birthDate": "2014-11-03",
            "birthTime": "12:00",
            "regionId": "北京市|北京城区|朝阳区",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["ziHourType"] == "非子时"
    assert any(item["code"] == "lunar-leap" for item in payload["banners"])
    assert payload["cases"][0]["metrics"]["lunarBirthdayDisplay"] == "2014年闰9月11日"
    assert payload["cases"][0]["charts"]["yin"]["digitString"] == "111891"
    assert payload["cases"][0]["charts"]["yin"]["subSoul"] == "1118"
    assert payload["cases"][0]["charts"]["yin"]["mainSoul"] == "91"


def test_create_chart_for_min_supported_date() -> None:
    response = client.post(
        "/api/v1/charts",
        json={
            "name": "秦瑾",
            "gender": "男",
            "birthDate": "1910-01-01",
            "birthTime": "12:00",
            "regionId": "北京市|北京城区|朝阳区",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["inputBirthDate"] == "1910-01-01"
    assert payload["cases"]


def test_create_chart_for_max_supported_date() -> None:
    response = client.post(
        "/api/v1/charts",
        json={
            "name": "最大边界",
            "gender": "男",
            "birthDate": "2070-12-31",
            "birthTime": "12:00",
            "regionId": "北京市|北京城区|朝阳区",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["summary"]["inputBirthDate"] == "2070-12-31"
    assert payload["cases"]


def test_create_chart_rejects_invalid_date_format() -> None:
    response = client.post(
        "/api/v1/charts",
        json={
            "name": "错误日期",
            "gender": "男",
            "birthDate": "1999/13/40",
            "birthTime": "06:00",
            "regionId": "新疆维吾尔自治区|乌鲁木齐市|头屯河区",
        },
    )

    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "bad_request"


def test_create_chart_rejects_invalid_time_format() -> None:
    response = client.post(
        "/api/v1/charts",
        json={
            "name": "错误时间",
            "gender": "男",
            "birthDate": "1999-10-11",
            "birthTime": "25:61",
            "regionId": "新疆维吾尔自治区|乌鲁木齐市|头屯河区",
        },
    )

    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "bad_request"


def test_create_chart_rejects_out_of_range_date() -> None:
    response = client.post(
        "/api/v1/charts",
        json={
            "name": "越界日期",
            "gender": "男",
            "birthDate": "2080-01-01",
            "birthTime": "06:00",
            "regionId": "新疆维吾尔自治区|乌鲁木齐市|头屯河区",
        },
    )

    assert response.status_code == 400
    payload = response.json()
    assert payload["code"] == "bad_request"


def test_create_chart_rejects_unknown_region() -> None:
    response = client.post(
        "/api/v1/charts",
        json={
            "name": "未知地区",
            "gender": "男",
            "birthDate": "1999-10-11",
            "birthTime": "06:00",
            "regionId": "不存在|不存在|不存在",
        },
    )

    assert response.status_code == 400
    payload = response.json()
    assert payload["message"] == "地区不存在: 不存在|不存在|不存在"


def test_create_chart_rejects_missing_required_fields() -> None:
    response = client.post(
        "/api/v1/charts",
        json={
            "name": "缺字段",
            "gender": "男",
            "birthDate": "1999-10-11",
            "birthTime": "06:00",
        },
    )

    assert response.status_code == 422
    payload = response.json()
    assert payload["code"] == "validation_error"
