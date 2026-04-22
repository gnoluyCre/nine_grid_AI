import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CaseSelector } from "../components/CaseSelector";
import { ChartModeToggle } from "../components/ChartModeToggle";
import { MetricsPanel } from "../components/MetricsPanel";
import { NineGridBoard } from "../components/NineGridBoard";
import { ResultBannerList } from "../components/ResultBannerList";
import { ResultSummaryCard } from "../components/ResultSummaryCard";
import { buildResultViewModelFromApiResponse } from "../lib/viewModel";
import type { BirthChartApiResponse, BirthFormValue, ChartMode } from "../types/models";

interface ResultRouteState {
  formValue?: BirthFormValue;
  payload?: BirthChartApiResponse;
}

export function ResultPage() {
  const location = useLocation();
  const routeState = (location.state as ResultRouteState | undefined) ?? {};
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [mode, setMode] = useState<ChartMode>("yang");

  const payload = routeState.payload;
  const viewModel = useMemo(
    () => (payload ? buildResultViewModelFromApiResponse(payload, activeCaseIndex, mode) : null),
    [activeCaseIndex, mode, payload],
  );

  if (!viewModel) {
    return (
      <main className="min-h-dvh px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <div className="mx-auto max-w-3xl">
          <div className="card-surface p-8">
            <p className="font-display text-xs font-bold uppercase tracking-[0.24em] text-plum/60">Nine Grid System</p>
            <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink">缺少排盘结果</h1>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              当前页面没有拿到后端返回的数据，请回到输入页重新提交一次。
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex rounded-full border border-plum/15 bg-white/80 px-4 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5"
            >
              返回初始页
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const activeTab = viewModel.activeCase.tabs.find((tab) => tab.key === mode) ?? viewModel.activeCase.tabs[0];

  return (
    <main className="min-h-dvh px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <div className="mx-auto max-w-[min(96vw,92rem)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.24em] text-plum/60">Nine Grid System</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">九宫格排盘结果</h1>
          </div>
          <Link
            to="/"
            className="rounded-full border border-plum/15 bg-white/80 px-4 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5"
          >
            返回初始页
          </Link>
        </div>

        <div className="space-y-3.5">
          <ResultSummaryCard summary={viewModel.summary} />
          <ResultBannerList banners={viewModel.banners} />
          <CaseSelector value={viewModel.caseSelector} onSelect={setActiveCaseIndex} />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(22rem,1.1fr)]">
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
    </main>
  );
}
