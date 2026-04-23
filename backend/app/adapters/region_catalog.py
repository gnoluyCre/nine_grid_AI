# input: region.json 原始地区树与运行时根路径。
# output: 可查询的扁平地区目录对象。
# pos: 算法与 API 共享的地区数据适配器。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from ..runtime import ensure_project_root

ensure_project_root()

from nine_grid.region_data import RegionRepository  # noqa: E402


@dataclass(frozen=True)
class RegionRecord:
    id: str
    province_name: str
    city_name: str
    district_name: str
    longitude: float


class RegionCatalog:
    def __init__(self) -> None:
        self._repository = RegionRepository()

    @lru_cache(maxsize=1)
    def list_regions(self) -> list[RegionRecord]:
        records: list[RegionRecord] = []
        for province in self._repository._tree["provinces"]:
            for city in province["cities"]:
                for district in city["districts"]:
                    records.append(
                        RegionRecord(
                            id=self._build_region_id(
                                province["name"], city["name"], district["name"]
                            ),
                            province_name=province["name"],
                            city_name=city["name"],
                            district_name=district["name"],
                            longitude=float(district["longitude"]),
                        )
                    )
        return records

    @lru_cache(maxsize=1)
    def get_region_map(self) -> dict[str, RegionRecord]:
        return {record.id: record for record in self.list_regions()}

    def get_by_id(self, region_id: str) -> RegionRecord | None:
        return self.get_region_map().get(region_id)

    @staticmethod
    def _build_region_id(province_name: str, city_name: str, district_name: str) -> str:
        return "|".join([province_name, city_name, district_name])
