from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from nine_grid.region_data import RegionRepository


def main() -> None:
    repository = RegionRepository()

    provinces = repository.list_provinces()
    assert provinces, "省份列表不能为空"
    assert provinces[0]["name"], "省份名称不能为空"

    beijing_index = next(index for index, item in enumerate(provinces) if item["name"] == "北京市")
    cities = repository.list_cities(beijing_index)
    assert cities, "北京市城市列表不能为空"
    assert any(item["name"] == "北京城区" for item in cities), "北京市应包含北京城区"

    city_index = next(index for index, item in enumerate(cities) if item["name"] == "北京城区")
    districts = repository.list_districts(beijing_index, city_index)
    assert districts, "北京城区区县列表不能为空"
    assert any(item["name"] == "朝阳区" for item in districts), "北京城区应包含朝阳区"

    district_index = next(
        index for index, item in enumerate(districts) if item["name"] == "朝阳区"
    )
    selection = repository.build_region_selection(beijing_index, city_index, district_index)

    assert selection.province_name == "北京市"
    assert selection.city_name == "北京城区"
    assert selection.district_name == "朝阳区"
    assert selection.longitude > 0

    print("[PASS] region_repository")


if __name__ == "__main__":
    main()
