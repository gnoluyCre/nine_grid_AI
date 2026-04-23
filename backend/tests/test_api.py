from __future__ import annotations

from pathlib import Path
import sys
from itertools import count

from fastapi.testclient import TestClient
import sqlite3

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.main import create_app  # noqa: E402


class FakeMailService:
    def __init__(self) -> None:
        self.messages: list[dict[str, str]] = []

    def send_verification_code(self, recipient: str, code: str, purpose: str) -> None:
        self.messages.append(
            {
                "recipient": recipient,
                "code": code,
                "purpose": purpose,
            }
        )

    def latest_code(self, recipient: str, purpose: str) -> str:
        for item in reversed(self.messages):
            if item["recipient"] == recipient and item["purpose"] == purpose:
                return item["code"]
        raise AssertionError(f"missing verification code for {recipient} / {purpose}")


TEST_DB_PATH = PROJECT_ROOT / "backend" / "tests" / ".test-api.sqlite3"
if TEST_DB_PATH.exists():
    TEST_DB_PATH.unlink()
fake_mail_service = FakeMailService()
app = create_app(db_path=TEST_DB_PATH, mail_service=fake_mail_service)
client = TestClient(app)
AUTH_COUNTER = count(1)


def create_authenticated_client(
    *,
    email_prefix: str = "user",
    nickname: str = "测试用户",
    password: str = "secret123",
) -> tuple[TestClient, dict]:
    test_client = TestClient(app)
    index = next(AUTH_COUNTER)
    email = f"{email_prefix}{index}@example.com"
    send_code_response = test_client.post(
        "/api/v1/auth/register/send-code",
        json={
            "email": email,
            "password": password,
            "confirmPassword": password,
            "nickname": f"{nickname}{index}",
        },
    )
    assert send_code_response.status_code == 200
    response = test_client.post(
        "/api/v1/auth/register/confirm",
        json={
            "email": email,
            "password": password,
            "confirmPassword": password,
            "nickname": f"{nickname}{index}",
            "verificationCode": fake_mail_service.latest_code(email, "register"),
        },
    )
    assert response.status_code == 200
    return test_client, response.json()


def build_birth_payload(
    *,
    name: str = "林知微",
    gender: str = "男",
    birth_date: str = "1999-10-11",
    birth_time: str = "06:00",
    region_id: str = "新疆维吾尔自治区|乌鲁木齐市|头屯河区",
) -> dict[str, str]:
    return {
        "name": name,
        "gender": gender,
        "birthDate": birth_date,
        "birthTime": birth_time,
        "regionId": region_id,
    }


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


def test_register_login_logout_and_me_flow() -> None:
    register_client = TestClient(app)
    email = f"alpha{next(AUTH_COUNTER)}@example.com"
    send_code_response = register_client.post(
        "/api/v1/auth/register/send-code",
        json={
            "email": email,
            "password": "secret123",
            "confirmPassword": "secret123",
            "nickname": "阿尔法",
        },
    )
    assert send_code_response.status_code == 200

    register_response = register_client.post(
        "/api/v1/auth/register/confirm",
        json={
            "email": email,
            "password": "secret123",
            "confirmPassword": "secret123",
            "nickname": "阿尔法",
            "verificationCode": fake_mail_service.latest_code(email, "register"),
        },
    )

    assert register_response.status_code == 200
    register_payload = register_response.json()
    assert register_payload["email"] == email
    assert len(register_payload["userCode"]) == 6
    assert register_payload["avatarKey"].startswith("img")

    me_response = register_client.get("/api/v1/auth/me")
    assert me_response.status_code == 200
    assert me_response.json()["email"] == register_payload["email"]

    logout_response = register_client.post("/api/v1/auth/logout")
    assert logout_response.status_code == 204

    me_after_logout = register_client.get("/api/v1/auth/me")
    assert me_after_logout.status_code == 401
    assert me_after_logout.json()["message"] == "请先登录"

    login_response = register_client.post(
        "/api/v1/auth/login",
        json={
            "email": register_payload["email"],
            "password": "secret123",
        },
    )
    assert login_response.status_code == 200
    assert login_response.json()["nickname"] == "阿尔法"


def test_register_rejects_duplicate_email() -> None:
    email = f"repeat{next(AUTH_COUNTER)}@example.com"
    first_send = client.post(
        "/api/v1/auth/register/send-code",
        json={
            "email": email,
            "password": "secret123",
            "confirmPassword": "secret123",
            "nickname": "第一次",
        },
    )
    assert first_send.status_code == 200
    first_confirm = client.post(
        "/api/v1/auth/register/confirm",
        json={
            "email": email,
            "password": "secret123",
            "confirmPassword": "secret123",
            "nickname": "第一次",
            "verificationCode": fake_mail_service.latest_code(email, "register"),
        },
    )
    assert first_confirm.status_code == 200

    second_send = client.post(
        "/api/v1/auth/register/send-code",
        json={
            "email": email,
            "password": "secret123",
            "confirmPassword": "secret123",
            "nickname": "第二次",
        },
    )
    assert second_send.status_code == 400
    assert second_send.json()["message"] == "该邮箱已注册"


def test_register_requires_valid_verification_code() -> None:
    email = f"verify{next(AUTH_COUNTER)}@example.com"
    send_code_response = client.post(
        "/api/v1/auth/register/send-code",
        json={
            "email": email,
            "password": "secret123",
            "confirmPassword": "secret123",
            "nickname": "验证码用户",
        },
    )
    assert send_code_response.status_code == 200

    confirm_response = client.post(
        "/api/v1/auth/register/confirm",
        json={
            "email": email,
            "password": "secret123",
            "confirmPassword": "secret123",
            "nickname": "验证码用户",
            "verificationCode": "000000",
        },
    )
    assert confirm_response.status_code == 400
    assert confirm_response.json()["message"] == "验证码错误或已失效"


def test_password_reset_flow_updates_login_password() -> None:
    auth_client, user = create_authenticated_client(email_prefix="reset")
    logout_response = auth_client.post("/api/v1/auth/logout")
    assert logout_response.status_code == 204

    send_response = auth_client.post(
        "/api/v1/auth/password/send-code",
        json={"email": user["email"]},
    )
    assert send_response.status_code == 200

    reset_response = auth_client.post(
        "/api/v1/auth/password/reset",
        json={
            "email": user["email"],
            "verificationCode": fake_mail_service.latest_code(user["email"], "reset_password"),
            "newPassword": "updated123",
            "confirmPassword": "updated123",
        },
    )
    assert reset_response.status_code == 200

    old_login_response = auth_client.post(
        "/api/v1/auth/login",
        json={
            "email": user["email"],
            "password": "secret123",
        },
    )
    assert old_login_response.status_code == 401

    new_login_response = auth_client.post(
        "/api/v1/auth/login",
        json={
            "email": user["email"],
            "password": "updated123",
        },
    )
    assert new_login_response.status_code == 200


def test_chart_record_endpoints_require_login() -> None:
    guest_client = TestClient(app)
    create_response = guest_client.post("/api/v1/chart-records", json=build_birth_payload())
    assert create_response.status_code == 401
    assert create_response.json()["message"] == "请先登录"

    list_response = guest_client.get("/api/v1/chart-records")
    assert list_response.status_code == 401
    assert list_response.json()["message"] == "请先登录"


def test_create_chart_record_persists_full_result() -> None:
    auth_client, _ = create_authenticated_client()
    response = auth_client.post("/api/v1/chart-records", json=build_birth_payload())

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
    auth_client, _ = create_authenticated_client(email_prefix="filter")
    create_response = auth_client.post(
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

    response = auth_client.get(
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
    auth_client, _ = create_authenticated_client(email_prefix="detail")
    create_response = auth_client.post(
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

    response = auth_client.get(f"/api/v1/chart-records/{record_id}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == record_id
    assert payload["hasLunarLeapCase"] is True
    assert any(item["code"] == "lunar-leap" for item in payload["banners"])
    assert payload["cases"][0]["metrics"]["lunarIsLeapMonth"] is True


def test_update_chart_record_overwrites_existing_record() -> None:
    auth_client, _ = create_authenticated_client(email_prefix="update")
    create_response = auth_client.post(
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

    update_response = auth_client.put(
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
    auth_client, _ = create_authenticated_client(email_prefix="delete")
    create_response = auth_client.post(
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

    delete_response = auth_client.delete(f"/api/v1/chart-records/{record_id}")
    assert delete_response.status_code == 204

    get_response = auth_client.get(f"/api/v1/chart-records/{record_id}")
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
    auth_client, _ = create_authenticated_client(email_prefix="soft")
    create_response = auth_client.post(
        "/api/v1/chart-records",
        json=build_birth_payload(name="软删档案"),
    )
    assert create_response.status_code == 200
    record_id = create_response.json()["id"]

    delete_response = auth_client.delete(f"/api/v1/chart-records/{record_id}")
    assert delete_response.status_code == 204

    list_response = auth_client.get("/api/v1/chart-records")
    assert list_response.status_code == 200
    assert all(item["id"] != record_id for item in list_response.json()["items"])

    update_response = auth_client.put(
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

    second_delete_response = auth_client.delete(f"/api/v1/chart-records/{record_id}")
    assert second_delete_response.status_code == 400
    assert second_delete_response.json()["message"] == f"排盘记录不存在: {record_id}"


def test_chart_records_are_isolated_per_user() -> None:
    user_a_client, _ = create_authenticated_client(email_prefix="owner", nickname="甲")
    user_b_client, _ = create_authenticated_client(email_prefix="viewer", nickname="乙")

    create_response = user_a_client.post(
        "/api/v1/chart-records",
        json=build_birth_payload(name="甲的档案"),
    )
    assert create_response.status_code == 200
    record_id = create_response.json()["id"]

    user_a_list = user_a_client.get("/api/v1/chart-records")
    assert user_a_list.status_code == 200
    assert any(item["id"] == record_id for item in user_a_list.json()["items"])

    user_b_list = user_b_client.get("/api/v1/chart-records")
    assert user_b_list.status_code == 200
    assert all(item["id"] != record_id for item in user_b_list.json()["items"])

    user_b_detail = user_b_client.get(f"/api/v1/chart-records/{record_id}")
    assert user_b_detail.status_code == 400
    assert user_b_detail.json()["message"] == f"排盘记录不存在: {record_id}"
