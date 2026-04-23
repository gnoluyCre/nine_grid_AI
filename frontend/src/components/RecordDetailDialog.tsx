// input: 档案详情响应、关闭回调与结果展示组件。
// output: 对齐结果页实现的左右分栏档案详情弹层。
// pos: 档案管理页的详情查看容器。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { useEffect, useMemo, useState } from "react";
import { ChartModeToggle } from "./ChartModeToggle";
import { MetricsPanel } from "./MetricsPanel";
import { NineGridBoard } from "./NineGridBoard";
import { ResultBannerList } from "./ResultBannerList";
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
  const hasMultipleCases = (viewModel?.caseSelector.caseCount ?? 0) > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f1d45]/32 px-3 py-4 backdrop-blur-sm sm:px-5"
      onClick={onClose}
    >
      <section
        className="relative flex h-[min(88vh,51rem)] w-full max-w-[min(95vw,84rem)] flex-col overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,243,253,0.96))] shadow-soft"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#eee5f5] px-5 py-3.5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-plum/55">Record Detail</p>
            <h2 className="mt-1.5 font-display text-[1.7rem] font-extrabold tracking-tight text-ink">档案详情</h2>
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

        <div className="flex min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-4">
          {loading ? (
            <div className="flex h-full min-h-[16rem] items-center justify-center rounded-[28px] border border-line/80 bg-white/78 text-sm text-ink/55">
              档案详情加载中...
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
              {error}
            </div>
          ) : viewModel && activeTab ? (
            <div className="grid min-h-0 flex-1 items-start gap-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)]">
              <section className="flex min-h-0 flex-col">
                <div className="rounded-[20px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,241,252,0.92))] px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {hasMultipleCases ? (
                      <div className="inline-flex rounded-full border border-plum/10 bg-white/82 p-1 shadow-sm">
                        {viewModel.caseSelector.items.map((item) => {
                          const active = item.index === activeCaseIndex;

                          return (
                            <button
                              key={item.index}
                              type="button"
                              onClick={() => setActiveCaseIndex(item.index)}
                              className={`rounded-full px-3 py-1.5 text-xs font-display font-bold transition ${
                                active ? "bg-plum text-white shadow-sm" : "text-ink/58 hover:text-plum"
                              }`}
                            >
                              {`${item.label}·${activeTab.label}`}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                    <ChartModeToggle mode={mode} onChange={setMode} />
                  </div>

                  <div className="mt-2.5 space-y-1.5">
                    <ResultBannerList banners={viewModel.banners} />
                  </div>
                </div>

                <div className="mt-3 min-h-0 flex-1">
                  <NineGridBoard grid={activeTab.grid} title={activeTab.label} />
                </div>
              </section>

              <section className="min-h-0 rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,238,252,0.98))] p-4 shadow-soft">
                <div className="mb-3">
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-plum/62">分析概览</p>
                  <h2 className="mt-1 font-display text-[1.35rem] font-extrabold tracking-tight text-ink">
                    {viewModel.summary.name || "未命名档案"}
                  </h2>
                </div>
                <div className="min-h-0">
                  <MetricsPanel
                    summary={viewModel.summary}
                    metrics={viewModel.activeCase.metrics}
                    mode={mode}
                    activeGrid={activeTab.grid}
                    layout="stacked"
                    showHeading={false}
                  />
                </div>
              </section>
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
