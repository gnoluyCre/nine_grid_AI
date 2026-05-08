// input: 表单值、地区选项、可空字段规则、批量文本与提交回调。
// output: 可滚动首页内同宽紧凑的单人/批量排盘录入、低重渲染选择弹层、系统状态与提交可用性控制。
// pos: 前端录入区的核心表单组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { memo, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { BirthFormValue, PickerDraftState, RegionTreeNode } from "../types/models";
import { formatDateParts, formatTimeParts, parseDateParts, parseTimeParts } from "../lib/formState";
import { findRegionSelectionById } from "../lib/regionTree";
import { BatchBirthInput } from "./BatchBirthInput";
import { PickerSheet } from "./PickerSheet";
import { RegionPicker } from "./RegionPicker";
import { SubmitAction } from "./SubmitAction";

interface BirthFormProps {
  value: BirthFormValue;
  regionTree: RegionTreeNode[];
  onChange: (nextValue: BirthFormValue) => void;
  onSubmit: () => void;
  onBatchExport?: () => void;
  batchInputValue: string;
  batchInputError?: string;
  batchInputLoading?: boolean;
  onBatchInputChange: (value: string) => void;
  onBatchInputSubmit: () => void;
  loading?: boolean;
  editing?: boolean;
  batchExportDisabled?: boolean;
  batchExportHint?: string;
  statusPanel?: ReactNode;
}

const GENDER_OPTIONS = ["男", "女"];
const YEAR_OPTIONS = buildYearOptions();
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => index);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => index);
const YEAR_PICKER_ITEMS = YEAR_OPTIONS.map((year) => ({
  value: String(year),
  label: `${year}年`,
}));
const MONTH_PICKER_ITEMS = MONTH_OPTIONS.map((month) => ({
  value: String(month),
  label: `${month}月`,
}));
const HOUR_PICKER_ITEMS = HOUR_OPTIONS.map((hour) => ({
  value: String(hour),
  label: `${String(hour).padStart(2, "0")} 时`,
}));
const MINUTE_PICKER_ITEMS = MINUTE_OPTIONS.map((minute) => ({
  value: String(minute),
  label: `${String(minute).padStart(2, "0")} 分`,
}));

export function BirthForm({
  value,
  regionTree,
  onChange,
  onSubmit,
  onBatchExport,
  batchInputValue,
  batchInputError = "",
  batchInputLoading = false,
  onBatchInputChange,
  onBatchInputSubmit,
  loading = false,
  editing = false,
  batchExportDisabled = false,
  batchExportHint = "",
  statusPanel,
}: BirthFormProps) {
  const [activePicker, setActivePicker] = useState<"date" | "time" | null>(null);
  const selectedRegion = useMemo(() => findRegionSelectionById(regionTree, value.regionId), [regionTree, value.regionId]);
  const parsedDateValue = useDateDraft(value.birthDate);
  const parsedTimeValue = useTimeDraft(value.birthTime);
  const [dateDraft, setDateDraft] = useState<PickerDraftState>(parsedDateValue);
  const [timeDraft, setTimeDraft] = useState<PickerDraftState>(parsedTimeValue);
  const canSubmit = value.birthDate.trim().length > 0 && !loading;

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
  const dayPickerItems = useMemo(
    () =>
      Array.from({ length: availableDays }, (_, index) => index + 1).map((day) => ({
        value: String(day),
        label: `${day}日`,
      })),
    [availableDays],
  );

  useEffect(() => {
    if (activePicker !== "date") {
      setDateDraft(parsedDateValue);
    }
  }, [activePicker, parsedDateValue]);

  useEffect(() => {
    if (activePicker !== "time") {
      setTimeDraft(parsedTimeValue);
    }
  }, [activePicker, parsedTimeValue]);

  useEffect(() => {
    if (dateDraft.day && dateDraft.day > availableDays) {
      setDateDraft({
        year: selectedYear,
        month: selectedMonth,
        day: availableDays,
      });
    }
  }, [availableDays, dateDraft.day, selectedMonth, selectedYear]);

  function openDatePicker() {
    setDateDraft(parsedDateValue);
    setActivePicker("date");
  }

  function openTimePicker() {
    setTimeDraft(parsedTimeValue);
    setActivePicker("time");
  }

  function closePicker() {
    setDateDraft(parsedDateValue);
    setTimeDraft(parsedTimeValue);
    setActivePicker(null);
  }

  function updateDateDraft(nextValue: Partial<PickerDraftState>) {
    setDateDraft((currentDraft) => {
      const nextYear = nextValue.year ?? currentDraft.year ?? YEAR_OPTIONS[0];
      const nextMonth = nextValue.month ?? currentDraft.month ?? 1;
      const nextDay = Math.min(nextValue.day ?? currentDraft.day ?? 1, getDaysInMonth(nextYear, nextMonth));
      return {
        year: nextYear,
        month: nextMonth,
        day: nextDay,
      };
    });
  }

  function updateTimeDraft(nextValue: Partial<PickerDraftState>) {
    setTimeDraft((currentDraft) => ({
      hour: nextValue.hour ?? currentDraft.hour ?? 12,
      minute: nextValue.minute ?? currentDraft.minute ?? 0,
    }));
  }

  return (
    <>
      <div className="card-surface h-full w-full p-4 sm:p-5">
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum/55">信息录入</p>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">开始生成排盘结果</h2>
            <p className="max-w-3xl text-sm leading-5 text-ink/65">
              填写出生日期、时间、地区和基础信息后，系统将计算真太阳时、方案关系、阴阳格与灵魂结构。
            </p>
          </div>
          <p className="rounded-full border border-plum/10 bg-plum/5 px-4 py-2 text-xs font-semibold text-plum/72">
            生日必填，其余信息可后续补充
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)]">
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
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
                      onClick={() => updateField("gender", value.gender === option ? "" : option)}
                      className={`segmented-card ${value.gender === option ? "segmented-card-active" : ""}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-ink/48">选填，再次点击当前选项可清空。</p>
              </div>

              <PickerTrigger
                label="公历生日"
                value={value.birthDate || "请选择出生日期"}
                meta={value.birthDate ? "已选择" : "必填"}
                empty={!value.birthDate}
                onClick={openDatePicker}
              />

              <PickerTrigger
                label="出生时间"
                value={value.birthTime || "请选择出生时辰"}
                meta={value.birthTime ? "已选择" : "选填"}
                empty={!value.birthTime}
                onClick={openTimePicker}
              />
              {value.birthTime ? (
                <div className="-mt-2 sm:col-start-2">
                  <button
                    type="button"
                    onClick={() => updateField("birthTime", "")}
                    className="text-xs font-medium text-plum/58 transition hover:text-plum"
                  >
                    清空时辰
                  </button>
                </div>
              ) : null}

              <div className="sm:col-span-2">
                <RegionPicker regionTree={regionTree} value={value.regionId} onChange={(regionId) => updateField("regionId", regionId)} />
                {selectedRegion ? (
                  <p className="mt-2 text-xs text-ink/48">
                    当前用于计算的地区：{selectedRegion.provinceName} / {selectedRegion.cityName} / {selectedRegion.districtName}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-ink/48">未填写地区时不会计算真太阳时，相关结果统一显示为未知。</p>
                )}
              </div>
            </div>

            <SubmitAction
              onSubmit={onSubmit}
              onSecondaryAction={onBatchExport}
              loading={loading}
              editing={editing}
              disabled={!canSubmit}
              secondaryLabel="批量测算"
              secondaryDisabled={loading || batchExportDisabled}
              secondaryHint={batchExportHint}
            />
          </div>

          <div className="min-w-0 space-y-3">
            <BatchBirthInput
              value={batchInputValue}
              loading={batchInputLoading}
              disabled={loading || editing}
              error={batchInputError}
              onChange={onBatchInputChange}
              onSubmit={onBatchInputSubmit}
            />
            {statusPanel}
          </div>
        </div>
      </div>

      {activePicker === "date" ? (
        <PickerSheet
          open
          title="选择出生日期"
          description="生日为必填项，支持按年月日逐列选择，系统会自动处理大小月和闰年。"
          onClose={closePicker}
          onConfirm={() => {
            updateField("birthDate", formatDateParts(selectedYear, selectedMonth, selectedDay));
            setActivePicker(null);
          }}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <PickerColumn
              label="年份"
              items={YEAR_PICKER_ITEMS}
              activeValue={String(selectedYear)}
              onSelect={(nextYear) => updateDateDraft({ year: Number(nextYear) })}
            />
            <PickerColumn
              label="月份"
              items={MONTH_PICKER_ITEMS}
              activeValue={String(selectedMonth)}
              onSelect={(nextMonth) => updateDateDraft({ month: Number(nextMonth) })}
            />
            <PickerColumn
              label="日期"
              items={dayPickerItems}
              activeValue={String(selectedDay)}
              onSelect={(nextDay) => updateDateDraft({ day: Number(nextDay) })}
            />
          </div>
        </PickerSheet>
      ) : null}

      {activePicker === "time" ? (
        <PickerSheet
          open
          title="选择出生时间"
          description="时间为选填项，你可以按小时和分钟逐项调整；未填写时相关时辰与半补展示为未知。"
          onClose={closePicker}
          onConfirm={() => {
            updateField("birthTime", formatTimeParts(selectedHour, selectedMinute));
            setActivePicker(null);
          }}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <PickerColumn
              label="小时"
              items={HOUR_PICKER_ITEMS}
              activeValue={String(selectedHour)}
              onSelect={(nextHour) => updateTimeDraft({ hour: Number(nextHour) })}
            />
            <PickerColumn
              label="分钟"
              items={MINUTE_PICKER_ITEMS}
              activeValue={String(selectedMinute)}
              onSelect={(nextMinute) => updateTimeDraft({ minute: Number(nextMinute) })}
            />
          </div>
        </PickerSheet>
      ) : null}
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
  className = "",
}: {
  label: string;
  value: string;
  meta: string;
  onClick: () => void;
  empty?: boolean;
  className?: string;
}) {
  return (
    <div className={`block ${className}`}>
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

const PickerColumn = memo(function PickerColumn({
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
});
