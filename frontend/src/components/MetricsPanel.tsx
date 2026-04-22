import type { CaseMetricsViewModel, ChartMode, GridBoardViewModel } from "../types/models";
import type { ReactNode } from "react";

interface MetricsPanelProps {
  metrics: CaseMetricsViewModel;
  mode: ChartMode;
  activeGrid: GridBoardViewModel;
}

export function MetricsPanel({ metrics, mode, activeGrid }: MetricsPanelProps) {
  const activeMissingDisplay = formatMissingDigitsWithAttributes(activeGrid.missingDigits, activeGrid.missingCount);
  const halfSupplementDisplay = formatDigitItems(activeGrid.halfSupplement);
  const activeModeLabel = mode === "yang" ? "阳格" : "阴格";

  return (
    <section className="space-y-5">
      <div className="card-surface p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">基础信息</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricBlock label="阳历生日" value={metrics.solarBirthday} />
          <MetricBlock label="农历生日" value={metrics.lunarBirthday} />
          <MetricBlock label="年龄" value={`${metrics.age}岁`} />
        </div>
      </div>

      <div className="card-surface p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">{activeModeLabel}灵魂结构</p>
        <div>
          <MetricRow label="主魂" value={activeGrid.mainSoul || "—"} />
          <MetricRow label="副魂" value={activeGrid.subSoul || "—"} />
          <MetricRow label="魄" value={activeGrid.po || "—"} />
        </div>
      </div>

      <div className="card-surface p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">{activeModeLabel}缺门结果</p>
        <div>
          <MetricRow
            label={`${activeModeLabel}缺漏数字`}
            value={
              <AlignedMissingDisplay
                items={activeMissingDisplay.items}
                summaryText={activeMissingDisplay.summaryText}
              />
            }
          />
          <MetricRow
            label="半补"
            value={<AlignedMissingDisplay items={halfSupplementDisplay} />}
            valueClassName="w-full max-w-[70%]"
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
    <div className="flex flex-wrap gap-x-1.5 gap-y-2">
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
}: {
  items: Array<{
    digit: string;
    element: "金" | "木" | "水" | "火" | "土";
    text: string;
    toneClassName: string;
  }>;
  summaryText?: string;
}) {
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_7rem] items-start gap-x-4">
      <div className="min-w-0">
        <MissingItems items={items} />
      </div>
      <div className="flex justify-end">
        {summaryText ? (
          <span className="inline-flex items-center rounded-full border border-plum/12 bg-plum/6 px-2.5 py-1 text-xs font-semibold tracking-[0.04em] text-plum/65">
            {summaryText}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#f1ebf6] bg-white/70 p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-plum/50">{label}</p>
      <p className="font-display text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function MetricRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="metric-row">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-plum/55">{label}</p>
      <div className={`min-w-0 w-full font-display text-lg font-extrabold leading-8 text-plum ${valueClassName ?? ""}`}>
        {value}
      </div>
    </div>
  );
}
