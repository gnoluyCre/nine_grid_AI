// input: 表单值、地区选项、默认规则与提交回调。
// output: 首页出生信息录入表单与提交可用性控制。
// pos: 前端录入区的核心表单组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { useEffect, useMemo, useState } from "react";
import type { BirthFormValue, PickerDraftState, RegionTreeNode } from "../types/models";
import { QUICK_CASES } from "../fixtures/sampleCases";
import {
  DEFAULT_BIRTH_TIME,
  formatDateParts,
  formatTimeParts,
  parseDateParts,
  parseTimeParts,
} from "../lib/formState";
import { findRegionSelectionById } from "../lib/regionTree";
import { PickerSheet } from "./PickerSheet";
import { RegionPicker } from "./RegionPicker";
import { SubmitAction } from "./SubmitAction";

interface BirthFormProps {
  value: BirthFormValue;
  regionTree: RegionTreeNode[];
  onChange: (nextValue: BirthFormValue) => void;
  onPreset: (caseId: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  editing?: boolean;
}

const GENDER_OPTIONS = ["男", "女"];
const YEAR_OPTIONS = buildYearOptions();
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => index);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index);

export function BirthForm({ value, regionTree, onChange, onPreset, onSubmit, loading = false, editing = false }: BirthFormProps) {
  const [activePicker, setActivePicker] = useState<"date" | "time" | null>(null);
  const selectedRegion = useMemo(() => findRegionSelectionById(regionTree, value.regionId), [regionTree, value.regionId]);
  const dateDraft = useDateDraft(value.birthDate);
  const timeDraft = useTimeDraft(value.birthTime);
  const canSubmit = value.birthDate.trim().length > 0 && value.gender.trim().length > 0 && !loading;

  function updateField<Key extends keyof BirthFormValue>(key: Key, fieldValue: BirthFormValue[Key]) {
    onChange({
      ...value,
      [key]: fieldValue,
    });
  }

  const selectedYear = dateDraft.year ?? YEAR_OPTIONS[0];
  const selectedMonth = dateDraft.month ?? 1;
  const availableDays = getDaysInMonth(selectedYear, selectedMonth);
  const selectedDay = Math.min(dateDraft.day ?? 1, availableDays);
  const selectedHour = timeDraft.hour ?? 12;
  const selectedMinute = timeDraft.minute ?? 0;

  useEffect(() => {
    if (dateDraft.day && dateDraft.day > availableDays) {
      updateField("birthDate", formatDateParts(selectedYear, selectedMonth, availableDays));
    }
  }, [availableDays, dateDraft.day, selectedMonth, selectedYear]);

  return (
    <>
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
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">档案名</span>
            <input
              className="field-shell w-full"
              value={value.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="请输入档案名"
            />
          </label>

          <div className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">性别</span>
            <div className="grid grid-cols-2 gap-3">
              {GENDER_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateField("gender", option)}
                  className={`segmented-card ${value.gender === option ? "segmented-card-active" : ""}`}
                >
                  {option}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink/48">性别为必填项，请主动选择。</p>
          </div>

          <PickerTrigger
            label="公历生日"
            value={value.birthDate || "请选择出生日期"}
            meta={value.birthDate ? "已选择" : "必填"}
            empty={!value.birthDate}
            onClick={() => setActivePicker("date")}
          />

          <PickerTrigger
            label="出生时间"
            value={value.birthTime || DEFAULT_BIRTH_TIME}
            meta="默认 12:00"
            onClick={() => setActivePicker("time")}
          />

          <div className="sm:col-span-2">
            <RegionPicker regionTree={regionTree} value={value.regionId} onChange={(regionId) => updateField("regionId", regionId)} />
            {selectedRegion ? (
              <p className="mt-2 text-xs text-ink/48">
                当前用于计算的地区：{selectedRegion.provinceName} / {selectedRegion.cityName} / {selectedRegion.districtName}
              </p>
            ) : null}
          </div>
        </div>

        <SubmitAction onSubmit={onSubmit} loading={loading} editing={editing} disabled={!canSubmit} />
      </div>

      <PickerSheet
        open={activePicker === "date"}
        title="选择出生日期"
        description="生日为必填项，支持按年月日逐列选择，系统会自动处理大小月和闰年。"
        onClose={() => setActivePicker(null)}
        onConfirm={() => {
          updateField("birthDate", formatDateParts(selectedYear, selectedMonth, selectedDay));
          setActivePicker(null);
        }}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <PickerColumn
            label="年份"
            items={YEAR_OPTIONS.map((year) => ({
              value: String(year),
              label: `${year}年`,
            }))}
            activeValue={String(selectedYear)}
            onSelect={(nextYear) => updateField("birthDate", formatDateParts(Number(nextYear), selectedMonth, selectedDay))}
          />
          <PickerColumn
            label="月份"
            items={MONTH_OPTIONS.map((month) => ({
              value: String(month),
              label: `${month}月`,
            }))}
            activeValue={String(selectedMonth)}
            onSelect={(nextMonth) =>
              updateField("birthDate", formatDateParts(selectedYear, Number(nextMonth), Math.min(selectedDay, getDaysInMonth(selectedYear, Number(nextMonth)))))
            }
          />
          <PickerColumn
            label="日期"
            items={Array.from({ length: availableDays }, (_, index) => index + 1).map((day) => ({
              value: String(day),
              label: `${day}日`,
            }))}
            activeValue={String(selectedDay)}
            onSelect={(nextDay) => updateField("birthDate", formatDateParts(selectedYear, selectedMonth, Number(nextDay)))}
          />
        </div>
      </PickerSheet>

      <PickerSheet
        open={activePicker === "time"}
        title="选择出生时间"
        description="时间默认为 12:00，你可以按小时和分钟逐项调整。"
        onClose={() => setActivePicker(null)}
        onConfirm={() => {
          updateField("birthTime", formatTimeParts(selectedHour, selectedMinute));
          setActivePicker(null);
        }}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <PickerColumn
            label="小时"
            items={HOUR_OPTIONS.map((hour) => ({
              value: String(hour),
              label: `${String(hour).padStart(2, "0")} 时`,
            }))}
            activeValue={String(selectedHour)}
            onSelect={(nextHour) => updateField("birthTime", formatTimeParts(Number(nextHour), selectedMinute))}
          />
          <PickerColumn
            label="分钟"
            items={MINUTE_OPTIONS.map((minute) => ({
              value: String(minute),
              label: `${String(minute).padStart(2, "0")} 分`,
            }))}
            activeValue={String(selectedMinute)}
            onSelect={(nextMinute) => updateField("birthTime", formatTimeParts(selectedHour, Number(nextMinute)))}
          />
        </div>
      </PickerSheet>
    </>
  );
}

function useDateDraft(value: string): PickerDraftState {
  return useMemo(() => {
    const parts = parseDateParts(value);
    if (!parts) {
      return {
        year: 2000,
        month: 1,
        day: 1,
      };
    }
    return parts;
  }, [value]);
}

function useTimeDraft(value: string): PickerDraftState {
  return useMemo(() => parseTimeParts(value) ?? { hour: 12, minute: 0 }, [value]);
}

function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - 1900 + 1 }, (_, index) => currentYear - index);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function PickerTrigger({
  label,
  value,
  meta,
  onClick,
  empty = false,
}: {
  label: string;
  value: string;
  meta: string;
  onClick: () => void;
  empty?: boolean;
}) {
  return (
    <div className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-plum/60">{label}</span>
      <button type="button" onClick={onClick} className={`picker-trigger w-full text-left ${empty ? "picker-trigger-empty" : ""}`}>
        <span>
          <span className="picker-trigger-label">{label}</span>
          <span className="picker-trigger-value">{value}</span>
        </span>
        <span className="picker-trigger-meta">{meta}</span>
      </button>
    </div>
  );
}

function PickerColumn({
  label,
  items,
  activeValue,
  onSelect,
}: {
  label: string;
  items: Array<{ value: string; label: string }>;
  activeValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <section className="rounded-[28px] border border-line/80 bg-white/72 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">{label}</p>
      <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-1">
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
