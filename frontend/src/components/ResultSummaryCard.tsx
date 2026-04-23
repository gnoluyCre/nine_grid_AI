// input: 排盘摘要、指标、模式与当前九宫格数据。
// output: 更低高度的结果页与详情页共用分析概览容器。
// pos: 结果总览展示组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import type { CaseMetricsViewModel, ChartMode, GridBoardViewModel, ResultSummaryViewModel } from "../types/models";
import { MetricsPanel } from "./MetricsPanel";

interface ResultSummaryCardProps {
  summary: ResultSummaryViewModel;
  metrics: CaseMetricsViewModel;
  mode: ChartMode;
  activeGrid: GridBoardViewModel;
  title?: string;
}

export function ResultSummaryCard({ summary, metrics, mode, activeGrid, title }: ResultSummaryCardProps) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,243,253,0.98))] p-4 shadow-soft">
      <div className="flex flex-col gap-2.5">
        <div>
          <p className="mb-2 font-display text-[11px] font-bold uppercase tracking-[0.22em] text-plum/62">分析概览</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-xl font-extrabold tracking-tight text-ink sm:text-[1.45rem]">
              {summary.name || "未命名档案"}
            </h1>
            {title ? (
              <span className="inline-flex items-center rounded-full border border-plum/12 bg-plum/6 px-3 py-1 text-xs font-semibold text-plum/72">
                {title}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <MetricsPanel summary={summary} metrics={metrics} mode={mode} activeGrid={activeGrid} layout="compact" />
      </div>
    </section>
  );
}
