from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RegionSelection:
    province_name: str
    city_name: str
    district_name: str
    longitude: float
