# input: Pydantic 数据建模约定与算法字段定义。
# output: 算法输入输出所用的领域模型。
# pos: 独立算法包的数据结构层。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RegionSelection:
    province_name: str
    city_name: str
    district_name: str
    longitude: float
