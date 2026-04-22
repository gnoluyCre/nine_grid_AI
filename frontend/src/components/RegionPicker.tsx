import { useEffect, useMemo, useState } from "react";
import { PickerSheet } from "./PickerSheet";
import { findRegionSelectionById } from "../lib/regionTree";
import type { RegionSelectionValue, RegionTreeNode } from "../types/models";

interface RegionPickerProps {
  regionTree: RegionTreeNode[];
  value: string;
  onChange: (regionId: string) => void;
}

export function RegionPicker({ regionTree, value, onChange }: RegionPickerProps) {
  const [open, setOpen] = useState(false);
  const selectedValue = useMemo(() => findRegionSelectionById(regionTree, value), [regionTree, value]);
  const [draft, setDraft] = useState<RegionSelectionValue | null>(selectedValue);

  useEffect(() => {
    setDraft(selectedValue);
  }, [selectedValue]);

  const activeProvince = regionTree.find((province) => province.name === draft?.provinceName) ?? regionTree[0];
  const activeCity =
    activeProvince?.cities.find((city) => city.name === draft?.cityName) ?? activeProvince?.cities[0];
  const activeDistrict =
    activeCity?.districts.find((district) => district.id === draft?.regionId) ?? activeCity?.districts[0];

  function handleProvinceChange(provinceName: string) {
    const province = regionTree.find((item) => item.name === provinceName);
    const city = province?.cities[0];
    const district = city?.districts[0];
    if (!province || !city || !district) {
      return;
    }

    setDraft({
      provinceName: province.name,
      cityName: city.name,
      districtName: district.name,
      regionId: district.id,
    });
  }

  function handleCityChange(cityName: string) {
    if (!activeProvince) {
      return;
    }

    const city = activeProvince.cities.find((item) => item.name === cityName);
    const district = city?.districts[0];
    if (!city || !district) {
      return;
    }

    setDraft({
      provinceName: activeProvince.name,
      cityName: city.name,
      districtName: district.name,
      regionId: district.id,
    });
  }

  function handleDistrictChange(regionId: string) {
    if (!activeProvince || !activeCity) {
      return;
    }

    const district = activeCity.districts.find((item) => item.id === regionId);
    if (!district) {
      return;
    }

    setDraft({
      provinceName: activeProvince.name,
      cityName: activeCity.name,
      districtName: district.name,
      regionId: district.id,
    });
  }

  function handleConfirm() {
    if (draft?.regionId) {
      onChange(draft.regionId);
    }
    setOpen(false);
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">地区</span>
          <span className="text-xs text-ink/48">未修改时默认使用当前地区</span>
        </div>
        <button type="button" className="picker-trigger w-full text-left" onClick={() => setOpen(true)}>
          <span>
            <span className="picker-trigger-label">当前地区</span>
            <span className="picker-trigger-value">
              {selectedValue
                ? `${selectedValue.provinceName} / ${selectedValue.cityName} / ${selectedValue.districtName}`
                : "请选择出生地区"}
            </span>
          </span>
          <span className="picker-trigger-meta">三级联动</span>
        </button>
      </div>

      <PickerSheet
        open={open}
        title="选择出生地区"
        description="基于本地行政区数据逐级选择省、市、区，系统会按最终地区经度计算真太阳时。"
        onClose={() => {
          setDraft(selectedValue);
          setOpen(false);
        }}
        onConfirm={handleConfirm}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <PickerColumn
            label="省份"
            items={regionTree.map((province) => ({
              value: province.name,
              label: province.name,
            }))}
            activeValue={activeProvince?.name}
            onSelect={handleProvinceChange}
          />
          <PickerColumn
            label="城市"
            items={(activeProvince?.cities ?? []).map((city) => ({
              value: city.name,
              label: city.name,
            }))}
            activeValue={activeCity?.name}
            onSelect={handleCityChange}
          />
          <PickerColumn
            label="区县"
            items={(activeCity?.districts ?? []).map((district) => ({
              value: district.id,
              label: district.name,
            }))}
            activeValue={activeDistrict?.id}
            onSelect={handleDistrictChange}
          />
        </div>
      </PickerSheet>
    </>
  );
}

interface PickerColumnProps {
  label: string;
  items: Array<{
    value: string;
    label: string;
  }>;
  activeValue?: string;
  onSelect: (value: string) => void;
}

function PickerColumn({ label, items, activeValue, onSelect }: PickerColumnProps) {
  return (
    <section className="rounded-[28px] border border-line/80 bg-white/72 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">{label}</p>
      <div className="max-h-[18rem] space-y-2 overflow-y-auto pr-1">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect(item.value)}
            className={`picker-option ${activeValue === item.value ? "picker-option-active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
