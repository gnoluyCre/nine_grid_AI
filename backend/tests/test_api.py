from __future__ import annotations

from pathlib import Path
import sys

from fastapi.testclient import TestClient
import sqlite3

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.main import create_app  # noqa: E402

TEST_DB_PATH = PROJECT_ROOT / "backend" / "tests" / ".test-api.sqlite3"
if TEST_DB_PATH.exists():
    TEST_DB_PATH.unlink()
client = TestClient(create_app(db_path=TEST_DB_PATH))


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


def test_create_chart_record_persists_full_result() -> None:
    response = client.post(
        "/api/v1/chart-records",
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
    assert payload["id"] >= 1
    assert payload["regionId"] == "新疆维吾尔自治区|乌鲁木齐市|头屯河区"
    assert payload["regionText"] == "新疆维吾尔自治区 乌鲁木齐市 头屯河区"
    assert payload["ziHourType"] == "非子时"
    assert payload["caseCount"] == 1
    assert payload["hasLunarLeapCase"] is False
    assert payload["cases"][0]["charts"]["yang"]["digitString"] == "19314"
    assert payload["cases"][0]["charts"]["yin"]["digitString"] == "9404"


def test_list_chart_records_supports_digit_string_filter() -> None:
    create_response = client.post(
        "/api/v1/chart-records",
        json={
            "name": "许昭",
            "gender": "女",
            "birthDate": "2013-06-05",
            "birthTime": "23:35",
            "regionId": "浙江省|杭州市|西湖区",
        },
    )
    assert create_response.status_code == 200

    response = client.get(
        "/api/v1/chart-records",
        params={
            "digitString": "0189",
            "chartType": "yang",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    target = next(item for item in payload["items"] if item["ziHourType"] == "前子时")
    assert target["firstCaseYangDigitString"] == "0178"
    assert target["firstCaseYangMissingDigits"] == "49"
    assert target["firstCaseYinDigitString"] == "19101"
    assert target["firstCaseYinMissingDigits"] == "568"


def test_get_chart_record_returns_detail() -> None:
    create_response = client.post(
        "/api/v1/chart-records",
        json={
            "name": "沈知夏",
            "gender": "男",
            "birthDate": "2020-05-23",
            "birthTime": "12:00",
            "regionId": "浙江省|杭州市|西湖区",
        },
    )
    assert create_response.status_code == 200
    record_id = create_response.json()["id"]

    response = client.get(f"/api/v1/chart-records/{record_id}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == record_id
    assert payload["hasLunarLeapCase"] is True
    assert any(item["code"] == "lunar-leap" for item in payload["banners"])
    assert payload["cases"][0]["metrics"]["lunarIsLeapMonth"] is True


def test_update_chart_record_overwrites_existing_record() -> None:
    create_response = client.post(
        "/api/v1/chart-records",
        json={
            "name": "原始档案",
            "gender": "男",
            "birthDate": "1999-10-11",
            "birthTime": "06:00",
            "regionId": "新疆维吾尔自治区|乌鲁木齐市|头屯河区",
        },
    )
    assert create_response.status_code == 200
    created_payload = create_response.json()
    record_id = created_payload["id"]
    created_at = created_payload["createdAt"]

    update_response = client.put(
        f"/api/v1/chart-records/{record_id}",
        json={
            "name": "更新后的档案",
            "gender": "女",
            "birthDate": "2013-06-05",
            "birthTime": "23:35",
            "regionId": "浙江省|杭州市|西湖区",
        },
    )

    assert update_response.status_code == 200
    payload = update_response.json()
    assert payload["id"] == record_id
    assert payload["name"] == "更新后的档案"
    assert payload["gender"] == "女"
    assert payload["ziHourType"] == "前子时"
    assert payload["cases"][1]["charts"]["yang"]["digitString"] == "0189"
    assert payload["createdAt"] == created_at


def test_delete_chart_record_removes_record() -> None:
    create_response = client.post(
        "/api/v1/chart-records",
        json={
            "name": "待删除档案",
            "gender": "男",
            "birthDate": "2020-05-23",
            "birthTime": "12:00",
            "regionId": "浙江省|杭州市|西湖区",
        },
    )
    assert create_response.status_code == 200
    record_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/chart-records/{record_id}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/v1/chart-records/{record_id}")
    assert get_response.status_code == 400
    assert get_response.json()["message"] == f"排盘记录不存在: {record_id}"

    with sqlite3.connect(TEST_DB_PATH) as connection:
        connection.row_factory = sqlite3.Row
        record_row = connection.execute(
            "SELECT is_deleted, deleted_at, updated_at FROM chart_record WHERE id = ?",
            (record_id,),
        ).fetchone()
        case_rows = connection.execute(
            "SELECT COUNT(*) AS total FROM chart_case WHERE record_id = ?",
            (record_id,),
        ).fetchone()
        grid_rows = connection.execute(
            """
            SELECT COUNT(*) AS total
            FROM chart_grid
            WHERE case_id IN (SELECT id FROM chart_case WHERE record_id = ?)
            """,
            (record_id,),
        ).fetchone()

    assert record_row is not None
    assert record_row["is_deleted"] == 1
    assert record_row["deleted_at"] is not None
    assert record_row["updated_at"] is not None
    assert case_rows["total"] >= 1
    assert grid_rows["total"] >= 2


def test_delete_chart_record_hides_record_from_list_and_update() -> None:
    create_response = client.post(
        "/api/v1/chart-records",
        json={
            "name": "软删档案",
            "gender": "男",
            "birthDate": "1999-10-11",
            "birthTime": "06:00",
            "regionId": "新疆维吾尔自治区|乌鲁木齐市|头屯河区",
        },
    )
    assert create_response.status_code == 200
    record_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/chart-records/{record_id}")
    assert delete_response.status_code == 204

    list_response = client.get("/api/v1/chart-records")
    assert list_response.status_code == 200
    assert all(item["id"] != record_id for item in list_response.json()["items"])

    update_response = client.put(
        f"/api/v1/chart-records/{record_id}",
        json={
            "name": "尝试更新已删除档案",
            "gender": "女",
            "birthDate": "2013-06-05",
            "birthTime": "23:35",
            "regionId": "浙江省|杭州市|西湖区",
        },
    )
    assert update_response.status_code == 400
    assert update_response.json()["message"] == f"排盘记录不存在: {record_id}"

    second_delete_response = client.delete(f"/api/v1/chart-records/{record_id}")
    assert second_delete_response.status_code == 400
    assert second_delete_response.json()["message"] == f"排盘记录不存在: {record_id}"
