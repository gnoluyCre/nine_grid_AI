import type { RegionOption, RegionSelectionValue, RegionTreeCity, RegionTreeDistrict, RegionTreeNode } from "../types/models";

export function buildRegionTree(regions: RegionOption[]): RegionTreeNode[] {
  const provinceMap = new Map<string, Map<string, RegionTreeDistrict[]>>();

  for (const region of regions) {
    const cityMap = provinceMap.get(region.provinceName) ?? new Map<string, RegionTreeDistrict[]>();
    const districtList = cityMap.get(region.cityName) ?? [];
    districtList.push({
      id: region.id,
      name: region.districtName,
      longitude: region.longitude,
    });
    cityMap.set(region.cityName, districtList);
    provinceMap.set(region.provinceName, cityMap);
  }

  return Array.from(provinceMap.entries()).map(([provinceName, cityMap]) => ({
    name: provinceName,
    cities: Array.from(cityMap.entries()).map(
      ([cityName, districts]): RegionTreeCity => ({
        name: cityName,
        districts,
      }),
    ),
  }));
}

export function findRegionSelectionById(regionTree: RegionTreeNode[], regionId: string): RegionSelectionValue | null {
  for (const province of regionTree) {
    for (const city of province.cities) {
      const district = city.districts.find((item) => item.id === regionId);
      if (district) {
        return {
          provinceName: province.name,
          cityName: city.name,
          districtName: district.name,
          regionId: district.id,
        };
      }
    }
  }

  return null;
}

export function getFirstRegionSelection(regionTree: RegionTreeNode[]): RegionSelectionValue | null {
  const province = regionTree[0];
  const city = province?.cities[0];
  const district = city?.districts[0];

  if (!province || !city || !district) {
    return null;
  }

  return {
    provinceName: province.name,
    cityName: city.name,
    districtName: district.name,
    regionId: district.id,
  };
}

export function resolveRegionSelection(regionTree: RegionTreeNode[], regionId: string) {
  return findRegionSelectionById(regionTree, regionId) ?? getFirstRegionSelection(regionTree);
}
