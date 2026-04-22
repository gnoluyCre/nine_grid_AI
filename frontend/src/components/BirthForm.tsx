import type { BirthFormValue, RegionOption } from "../types/models";
import { QUICK_CASES } from "../fixtures/sampleCases";
import { RegionPicker } from "./RegionPicker";
import { SubmitAction } from "./SubmitAction";

interface BirthFormProps {
  value: BirthFormValue;
  regions: RegionOption[];
  onChange: (nextValue: BirthFormValue) => void;
  onPreset: (caseId: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export function BirthForm({ value, regions, onChange, onPreset, onSubmit, loading = false }: BirthFormProps) {
  function updateField<Key extends keyof BirthFormValue>(key: Key, fieldValue: BirthFormValue[Key]) {
    onChange({
      ...value,
      [key]: fieldValue,
    });
  }

  return (
    <div className="card-surface w-full p-6 sm:p-8">
      <div className="mb-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum/55">信息录入</p>
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink">开始生成排盘结果</h2>
        <p className="max-w-2xl text-sm leading-6 text-ink/65">
          填写出生日期、时间、地区和基础信息后，系统将计算真太阳时、方案关系、阴阳格与灵魂结构。
        </p>
      </div>

      <div className="mb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">快捷填充案例</p>
        <div className="flex flex-wrap gap-3">
          {QUICK_CASES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPreset(item.id)}
              className="rounded-full border border-plum/15 bg-white px-4 py-2 text-sm font-medium text-plum transition hover:border-plum/35 hover:bg-plum/5"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">姓名</span>
          <input
            className="field-shell w-full"
            value={value.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="请输入姓名"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">性别</span>
          <select
            className="field-shell w-full"
            value={value.gender}
            onChange={(event) => updateField("gender", event.target.value)}
          >
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">公历生日</span>
          <input
            className="field-shell w-full"
            type="date"
            value={value.birthDate}
            onChange={(event) => updateField("birthDate", event.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">出生时间</span>
          <input
            className="field-shell w-full"
            type="time"
            value={value.birthTime}
            onChange={(event) => updateField("birthTime", event.target.value)}
          />
        </label>
      </div>

      <div className="mt-5">
        <RegionPicker
          regions={regions}
          value={value.regionId}
          onChange={(regionId) => updateField("regionId", regionId)}
        />
      </div>

      <SubmitAction onSubmit={onSubmit} loading={loading} />
    </div>
  );
}
