// input: 排盘摘要视图模型。
// output: 结果页顶部摘要卡片。
// pos: 结果总览展示组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import type { ResultSummaryViewModel } from "../types/models";

interface ResultSummaryCardProps {
  summary: ResultSummaryViewModel;
}

export function ResultSummaryCard({ summary }: ResultSummaryCardProps) {
  return (
    <section className="card-surface p-6 sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-3 font-display text-xs font-bold uppercase tracking-[0.24em] text-plum/65">分析概览</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            {summary.name || "未命名用户"}
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            {summary.gender} · {summary.regionText}
          </p>
        </div>
        <div className="rounded-full border border-plum/10 bg-plum/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-plum/75">
          {summary.ziHourType}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Info label="输入生日" value={summary.inputBirthDate} />
        <Info label="输入时间" value={summary.inputBirthTime} />
      </div>
    </section>
  );
}

function Info({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-3xl border px-4 py-4 ${highlight ? "border-plum/15 bg-plum/5" : "border-[#f0e8f6] bg-white/70"}`}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-plum/55">{label}</p>
      <p className={`font-display text-lg font-bold ${highlight ? "text-plum" : "text-ink"}`}>{value}</p>
    </div>
  );
}
