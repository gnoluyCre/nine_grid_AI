import type { RegionOption } from "../types/models";

interface RegionPickerProps {
  regions: RegionOption[];
  value: string;
  onChange: (regionId: string) => void;
}

export function RegionPicker({ regions, value, onChange }: RegionPickerProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">地区</span>
      <select className="field-shell w-full" value={value} onChange={(event) => onChange(event.target.value)}>
        {regions.map((region) => (
          <option key={region.id} value={region.id}>
            {region.provinceName} / {region.cityName} / {region.districtName}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-ink/50">原型阶段使用静态地区选项，不直接接真实三级联动接口。</p>
    </label>
  );
}
