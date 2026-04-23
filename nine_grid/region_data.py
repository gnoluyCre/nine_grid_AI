# input: region.json 原始地区树与文件系统路径。
# output: 算法包可直接消费的地区数据接口。
# pos: 独立算法包的数据读取层。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from .models import RegionSelection


class RegionRepository:
    def __init__(self, region_file: Path | None = None):
        self._region_file = region_file or Path(__file__).resolve().parents[1] / "region.json"
        self._tree = _load_region_tree(self._region_file)

    def list_provinces(self) -> list[dict]:
        return [{"name": item["name"]} for item in self._tree["provinces"]]

    def list_cities(self, province_index: int) -> list[dict]:
        province = self._tree["provinces"][province_index]
        return [{"name": item["name"]} for item in province["cities"]]

    def list_districts(self, province_index: int, city_index: int) -> list[dict]:
        city = self._tree["provinces"][province_index]["cities"][city_index]
        return [{"name": item["name"]} for item in city["districts"]]

    def build_region_selection(
        self, province_index: int, city_index: int, district_index: int
    ) -> RegionSelection:
        province = self._tree["provinces"][province_index]
        city = province["cities"][city_index]
        district = city["districts"][district_index]
        return RegionSelection(
            province_name=province["name"],
            city_name=city["name"],
            district_name=district["name"],
            longitude=district["longitude"],
        )


@lru_cache(maxsize=1)
def _load_region_tree(region_file: Path) -> dict:
    data = json.loads(region_file.read_text(encoding="utf-8"))
    provinces = [_normalize_province(node) for node in data.get("districts", [])]
    return {"name": data.get("name", ""), "provinces": provinces}


def _normalize_province(province_node: dict) -> dict:
    normalized_cities = []
    for city_node in province_node.get("districts", []):
        districts = city_node.get("districts", [])
        if districts:
            normalized_cities.append(
                {
                    "name": city_node["name"],
                    "districts": [_normalize_district(district) for district in districts],
                }
            )
        else:
            normalized_cities.append(
                {
                    "name": province_node["name"],
                    "districts": [_normalize_district(city_node)],
                }
            )

    if not normalized_cities:
        normalized_cities.append(
            {
                "name": province_node["name"],
                "districts": [_normalize_district(province_node)],
            }
        )

    return {"name": province_node["name"], "cities": normalized_cities}


def _normalize_district(district_node: dict) -> dict:
    center = district_node.get("center", {})
    return {
        "name": district_node["name"],
        "longitude": center["longitude"],
    }
