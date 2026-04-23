// input: 路由状态、结果视图映射与结果页组件。
// output: 九宫格排盘结果页面。
// pos: 前端结果展示页面容器。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CaseSelector } from "../components/CaseSelector";
import { ChartModeToggle } from "../components/ChartModeToggle";
import { MetricsPanel } from "../components/MetricsPanel";
import { NineGridBoard } from "../components/NineGridBoard";
import { ResultBannerList } from "../components/ResultBannerList";
import { ResultSummaryCard } from "../components/ResultSummaryCard";
import { UserAccountPanel } from "../components/UserAccountPanel";
import { useAuth } from "../context/AuthContext";
import { saveNewRecordIntent } from "../lib/formState";
import { buildResultViewModelFromApiResponse, buildResultViewModelFromRecordDetail } from "../lib/viewModel";
import type { BirthChartApiResponse, BirthFormValue, ChartMode, ChartRecordDetailResponse } from "../types/models";

interface ResultRouteState {
  formValue?: BirthFormValue;
  payload?: BirthChartApiResponse | ChartRecordDetailResponse;
  recordId?: number;
  recordAction?: "created" | "updated";
}

export function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const routeState = (location.state as ResultRouteState | undefined) ?? {};
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [mode, setMode] = useState<ChartMode>("yang");

  const payload = routeState.payload;
  const formValue = routeState.formValue;
  const viewModel = useMemo(
    () =>
      payload
        ? "id" in payload
          ? buildResultViewModelFromRecordDetail(payload, activeCaseIndex, mode)
          : buildResultViewModelFromApiResponse(payload, activeCaseIndex, mode)
        : null,
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
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 inline-flex rounded-full border border-plum/15 bg-white/80 px-4 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5"
            >
              返回上一步输入
            </button>
          </div>
        </div>
      </main>
    );
  }

  const activeTab = viewModel.activeCase.tabs.find((tab) => tab.key === mode) ?? viewModel.activeCase.tabs[0];

  function handleReturnToInput() {
    navigate("/", {
      state: {
        returnMode: "restore-input",
        formValue,
      },
    });
  }

  function handleCreateNewRecord() {
    saveNewRecordIntent();
    navigate("/", {
      state: {
        returnMode: "new-record",
      },
    });
  }

  return (
    <main className="min-h-dvh px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <div className="mx-auto max-w-[min(96vw,92rem)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.24em] text-plum/60">Nine Grid System</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">九宫格排盘结果</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <UserAccountPanel />
            <button
              type="button"
              onClick={() => navigate(isAuthenticated ? "/records" : "/login", { state: { redirectTo: "/records" } })}
              className="rounded-full border border-plum/15 bg-white/80 px-4 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5"
            >
              档案管理
            </button>
            <button
              type="button"
              onClick={handleReturnToInput}
              className="rounded-full border border-plum/15 bg-white/80 px-4 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5"
            >
              返回上一步输入
            </button>
          </div>
        </div>

        <div className="space-y-3.5">
          <ResultSummaryCard summary={viewModel.summary} />
          {routeState.recordAction === "created" && routeState.recordId ? (
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              当前结果已保存为档案 #{routeState.recordId}。
            </div>
          ) : null}
          {routeState.recordAction === "updated" ? (
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              当前结果已同步覆盖原档案。
            </div>
          ) : null}
          {!isAuthenticated ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              当前为访客排盘模式。登录后重新排盘，系统会自动按你的账号保存档案。
            </div>
          ) : null}
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
      {formValue ? (
        <button
          type="button"
          onClick={handleCreateNewRecord}
          className="fixed bottom-5 right-5 z-40 rounded-full bg-gradient-to-r from-plum to-iris px-5 py-3 font-display text-sm font-bold text-white shadow-soft transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60 sm:bottom-7 sm:right-7"
        >
          新增档案
        </button>
      ) : null}
    </main>
  );
}
