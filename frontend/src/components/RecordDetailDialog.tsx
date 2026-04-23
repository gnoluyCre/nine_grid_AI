// input: 档案详情响应、关闭回调与结果展示组件。
// output: 档案详情的居中只读弹层。
// pos: 档案管理页的详情查看容器。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { useEffect, useMemo, useState } from "react";
import { CaseSelector } from "./CaseSelector";
import { ChartModeToggle } from "./ChartModeToggle";
import { MetricsPanel } from "./MetricsPanel";
import { NineGridBoard } from "./NineGridBoard";
import { ResultBannerList } from "./ResultBannerList";
import { ResultSummaryCard } from "./ResultSummaryCard";
import { buildResultViewModelFromRecordDetail } from "../lib/viewModel";
import type { ChartMode, ChartRecordDetailResponse } from "../types/models";

interface RecordDetailDialogProps {
  open: boolean;
  payload: ChartRecordDetailResponse | null;
  loading: boolean;
  error: string;
  onClose: () => void;
}

export function RecordDetailDialog({
  open,
  payload,
  loading,
  error,
  onClose,
}: RecordDetailDialogProps) {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [mode, setMode] = useState<ChartMode>("yang");

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) {
      setActiveCaseIndex(0);
      setMode("yang");
    }
  }, [open]);

  const viewModel = useMemo(() => {
    if (!payload) {
      return null;
    }
    return buildResultViewModelFromRecordDetail(payload, activeCaseIndex, mode);
  }, [activeCaseIndex, mode, payload]);

  if (!open) {
    return null;
  }

  const activeTab = viewModel?.activeCase.tabs.find((tab) => tab.key === mode) ?? viewModel?.activeCase.tabs[0] ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f1d45]/32 px-3 py-4 backdrop-blur-sm sm:px-5"
      onClick={onClose}
    >
      <section
        className="relative flex h-[min(92vh,64rem)] w-full max-w-[min(96vw,88rem)] flex-col overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,243,253,0.96))] shadow-soft"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#eee5f5] px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-plum/55">Record Detail</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">档案详情</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-plum/15 bg-white/88 text-xl font-semibold text-plum transition hover:bg-plum/5"
            aria-label="关闭详情"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {loading ? (
            <div className="flex h-full min-h-[16rem] items-center justify-center rounded-[28px] border border-line/80 bg-white/78 text-sm text-ink/55">
              档案详情加载中...
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : viewModel && activeTab ? (
            <div className="space-y-4">
              <ResultSummaryCard summary={viewModel.summary} />
              <ResultBannerList banners={viewModel.banners} />
              <CaseSelector value={viewModel.caseSelector} onSelect={setActiveCaseIndex} />

              <div className="grid gap-4 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(22rem,1.1fr)]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/70 bg-white/60 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">
                        {viewModel.activeCase.label} · {viewModel.activeCase.dateRelation}
                      </p>
                      <p className="mt-2 font-display text-lg font-bold text-ink">{activeTab.label}</p>
                    </div>
                    <ChartModeToggle mode={mode} onChange={setMode} />
                  </div>
                  <NineGridBoard grid={activeTab.grid} title={activeTab.label} />
                </div>

                <MetricsPanel
                  metrics={viewModel.activeCase.metrics}
                  mode={mode}
                  activeGrid={activeTab.grid}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border border-line/80 bg-white/78 px-5 py-4 text-sm text-ink/55">
              当前档案没有可展示的详情数据。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
