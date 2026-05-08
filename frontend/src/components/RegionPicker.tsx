// input: 地区树、当前选择值与确认回调。
// output: 支持留空且弹层打开时才构造可滚动列表的三级地区联动选择器。
// pos: 出生地区录入专用选择组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { memo, useEffect, useMemo, useState } from "react";
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
  const provinceItems = useMemo(
    () =>
      regionTree.map((province) => ({
        value: province.name,
        label: province.name,
      })),
    [regionTree],
  );
  const cityItems = useMemo(
    () =>
      (activeProvince?.cities ?? []).map((city) => ({
        value: city.name,
        label: city.name,
      })),
    [activeProvince],
  );
  const districtItems = useMemo(
    () =>
      (activeCity?.districts ?? []).map((district) => ({
        value: district.id,
        label: district.name,
      })),
    [activeCity],
  );

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
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink/48">选填，未填写则相关结果显示未知</span>
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-xs font-medium text-plum/58 transition hover:text-plum"
              >
                清空地区
              </button>
            ) : null}
          </div>
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

      {open ? (
        <PickerSheet
          open
          title="选择出生地区"
          description="基于本地行政区数据逐级选择省、市、区；未填写地区时不会计算真太阳时。"
          onClose={() => {
            setDraft(selectedValue);
            setOpen(false);
          }}
          onConfirm={handleConfirm}
        >
          <div className="grid min-h-0 gap-3 sm:grid-cols-3 sm:gap-4">
            <PickerColumn label="省份" items={provinceItems} activeValue={activeProvince?.name} onSelect={handleProvinceChange} />
            <PickerColumn label="城市" items={cityItems} activeValue={activeCity?.name} onSelect={handleCityChange} />
            <PickerColumn label="区县" items={districtItems} activeValue={activeDistrict?.id} onSelect={handleDistrictChange} />
          </div>
        </PickerSheet>
      ) : null}
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

const PickerColumn = memo(function PickerColumn({ label, items, activeValue, onSelect }: PickerColumnProps) {
  return (
    <section className="min-h-0 rounded-[22px] border border-line/80 bg-white/72 p-3 sm:rounded-[28px] sm:p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">{label}</p>
      <div className="max-h-[28vh] space-y-2 overflow-y-auto pr-1 sm:max-h-[46vh]">
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
});
