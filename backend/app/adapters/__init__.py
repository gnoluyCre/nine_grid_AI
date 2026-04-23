# input: adapters 子模块中的地区目录适配器实现。
# output: RegionCatalog 适配器导出。
# pos: backend 适配层的聚合出口。
# 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
from .region_catalog import RegionCatalog

__all__ = ["RegionCatalog"]
