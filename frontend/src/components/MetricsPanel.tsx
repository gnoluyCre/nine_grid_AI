// input: 排盘摘要、案例指标、模式与当前九宫格数据。
// output: 分析概览内的基础信息、纵向灵魂结构与图腾天赋特质面板。
// pos: 结果详情展示组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import type { CaseMetricsViewModel, ChartMode, GridBoardViewModel, ResultSummaryViewModel } from "../types/models";
import type { ReactNode } from "react";
import { buildSoulProfile } from "../lib/numerologyProfile";
import { formatHalfSupplementDisplay, formatShichenLabel, formatUnknownDisplay, UNKNOWN_DISPLAY } from "../lib/shichen";

interface MetricsPanelProps {
  summary: ResultSummaryViewModel;
  metrics: CaseMetricsViewModel;
  mode: ChartMode;
  activeGrid: GridBoardViewModel;
  layout?: "stacked" | "compact";
  showHeading?: boolean;
}

export function MetricsPanel({ summary, metrics, mode, activeGrid, layout = "stacked", showHeading = true }: MetricsPanelProps) {
  const activeMissingDisplay = formatMissingDigitsWithAttributes(activeGrid.missingDigits, activeGrid.missingCount);
  const halfSupplementDisplay = formatDigitItems(activeGrid.halfSupplement);
  const activeModeLabel = mode === "yang" ? "阳格" : "阴格";
  const soulProfile = buildSoulProfile(activeGrid.mainSoul, activeGrid.digitString);
  const shichenLabel = formatShichenLabel(metrics.trueSolarShichen);
  const regionText = formatUnknownDisplay(summary.regionText);
  const genderText = formatUnknownDisplay(summary.gender);
  const halfSupplementText = formatHalfSupplementDisplay(activeGrid.halfSupplement);
  const shellClassName =
    layout === "compact"
      ? "grid gap-3 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]"
      : "space-y-4";

  return (
    <section className={shellClassName}>
      <div className="rounded-[22px] border border-[#e8def3] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(250,245,253,0.96))] px-4 py-3.5 shadow-sm">
        {showHeading ? <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-plum/55">基础信息</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricBlock label="阳历生日·时辰" value={joinDateAndShichen(metrics.solarBirthday, shichenLabel)} />
          <MetricBlock label="农历生日·时辰" value={joinDateAndShichen(metrics.lunarBirthday, shichenLabel)} />
          <MetricBlock label="性别·年龄" value={`${genderText} ${metrics.age}岁`} />
          <MetricBlock label="地区" value={regionText} />
        </div>
      </div>

      <div className="rounded-[22px] border border-[#ddcff0] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,236,252,0.98))] px-4 py-4 shadow-sm">
        {showHeading ? <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-plum/62">{activeModeLabel}灵魂结构</p> : null}
        <div className="space-y-0">
          <MetricRow label="主魂" value={activeGrid.mainSoul || "—"} emphasis />
          <MetricRow label="副魂" value={activeGrid.subSoul || "—"} emphasis />
          <MetricRow label="魄" value={activeGrid.po || "—"} emphasis />
          <MetricRow label="对应格" value={activeGrid.digitString || "—"} emphasis />
          <MetricRow
            label="缺漏数字"
            value={
              <AlignedMissingDisplay
                items={activeMissingDisplay.items}
                summaryText={activeMissingDisplay.summaryText}
                emphasis
              />
            }
            valueClassName="w-full"
            emphasis
          />
          <MetricRow
            label="半补"
            value={halfSupplementText === UNKNOWN_DISPLAY ? UNKNOWN_DISPLAY : <AlignedMissingDisplay items={halfSupplementDisplay} emphasis />}
            valueClassName="w-full"
            emphasis
          />
          <MetricRow label="图腾" value={soulProfile.totem} emphasis />
          <MetricRow
            label="天赋"
            value={soulProfile.talentsText}
            valueClassName="w-full whitespace-pre-wrap break-words text-left"
            emphasis
          />
          <MetricRow
            label="特质"
            value={soulProfile.traitsText}
            valueClassName="w-full whitespace-pre-wrap break-words text-left"
            emphasis
          />
        </div>
      </div>
    </section>
  );
}

export function getElementByDigit(digit: string): "金" | "木" | "水" | "火" | "土" {
  if (digit === "1" || digit === "2") {
    return "金";
  }
  if (digit === "4" || digit === "5") {
    return "木";
  }
  if (digit === "0" || digit === "6") {
    return "水";
  }
  if (digit === "3") {
    return "火";
  }
  return "土";
}

function getElementTone(element: "金" | "木" | "水" | "火" | "土") {
  switch (element) {
    case "金":
      return "text-slate-600";
    case "木":
      return "text-emerald-700";
    case "水":
      return "text-sky-700";
    case "火":
      return "text-rose-700";
    case "土":
      return "text-amber-700";
  }
}

export function formatMissingDigitsWithAttributes(
  missingDigits: string,
  missingCount: number,
): {
  items: Array<{
    digit: string;
    element: "金" | "木" | "水" | "火" | "土";
    text: string;
    toneClassName: string;
  }>;
  summaryText: string;
} {
  return {
    items: formatDigitItems(missingDigits),
    summaryText: `（缺${missingCount}门）`,
  };
}

function formatDigitItems(source: string) {
  return [...source]
    .filter((digit) => /\d/.test(digit))
    .map((digit) => {
      const element = getElementByDigit(digit);

      return {
        digit,
        element,
        text: `${digit}（${element}）`,
        toneClassName: getElementTone(element),
      };
    });
}

function MissingItems({
  items,
}: {
  items: Array<{
    digit: string;
    element: "金" | "木" | "水" | "火" | "土";
    text: string;
    toneClassName: string;
  }>;
}) {
  return (
    <div className="flex flex-wrap gap-x-1 gap-y-1.5">
      {items.map((item, index) => (
        <span key={`${item.digit}-${index}`} className={`transition-colors ${item.toneClassName}`}>
          {item.text}
          {index < items.length - 1 ? "、" : ""}
        </span>
      ))}
    </div>
  );
}

function AlignedMissingDisplay({
  items,
  summaryText,
  emphasis = false,
}: {
  items: Array<{
    digit: string;
    element: "金" | "木" | "水" | "火" | "土";
    text: string;
    toneClassName: string;
  }>;
  summaryText?: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`grid w-full items-start gap-x-3 ${summaryText ? "grid-cols-[minmax(0,1fr)_6.5rem]" : "grid-cols-1"}`}>
      <div className="min-w-0">
        <MissingItems items={items} />
      </div>
      <div className="flex justify-end">
        {summaryText ? (
          <span
            className={`inline-flex items-center rounded-full border border-plum/12 bg-plum/6 px-2.5 py-0.5 font-semibold tracking-[0.04em] text-plum/65 ${
              emphasis ? "text-xs" : "text-[11px]"
            }`}
          >
            {summaryText}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#f1ebf6] bg-white/80 px-3.5 py-3">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-plum/50">{label}</p>
      <p className="font-display text-base font-bold text-ink">{value}</p>
    </div>
  );
}

function MetricRow({
  label,
  value,
  valueClassName,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`metric-row ${emphasis ? "!py-3" : "!py-2.5"}`}>
      <p className={`${emphasis ? "text-xs" : "text-[10px]"} font-semibold uppercase tracking-[0.16em] text-plum/60`}>{label}</p>
      <div
        className={`min-w-0 w-full font-display font-extrabold text-plum ${
          emphasis ? "text-lg leading-8" : "text-base leading-7"
        } ${valueClassName ?? ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function joinDateAndShichen(dateText: string, shichenLabel: string) {
  return `${dateText} ${shichenLabel}`;
}
