// input: 路由状态、结果视图映射与结果页组件。
// output: 左九宫格右满高分析概览与底部 AI 按钮的排盘结果页面。
// pos: 前端结果展示页面容器。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChartModeToggle } from "../components/ChartModeToggle";
import { MetricsPanel } from "../components/MetricsPanel";
import { NineGridBoard } from "../components/NineGridBoard";
import { ResultBannerList } from "../components/ResultBannerList";
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
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

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
  const hasMultipleCases = viewModel.caseSelector.caseCount > 1;

  useEffect(() => {
    if (!aiDialogOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAiDialogOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [aiDialogOpen]);

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
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.24em] text-plum/60">Nine Grid System</p>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">九宫格排盘结果</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleReturnToInput}
              className="rounded-full border border-plum/15 bg-white/80 px-4 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5"
            >
              返回首页
            </button>
            <UserAccountPanel />
            <button
              type="button"
              onClick={() => navigate(isAuthenticated ? "/records" : "/login", { state: { redirectTo: "/records" } })}
              className="rounded-full border border-plum/15 bg-white/80 px-4 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5"
            >
              档案管理
            </button>
          </div>
        </div>

        <div className="grid min-h-[calc(100dvh-9.5rem)] gap-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)]">
          <section className="card-surface flex min-h-0 flex-col p-4">
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
                {routeState.recordAction === "created" && routeState.recordId ? (
                  <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
                    当前结果已保存为档案 #{routeState.recordId}。
                  </div>
                ) : null}
                {routeState.recordAction === "updated" ? (
                  <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
                    当前结果已同步覆盖原档案。
                  </div>
                ) : null}
                {!isAuthenticated ? (
                  <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
                    当前为访客排盘模式。登录后重新排盘，系统会自动按你的账号保存档案。
                  </div>
                ) : null}
                <ResultBannerList banners={viewModel.banners} />
              </div>
            </div>

            <div className="mt-3 min-h-0 flex-1">
              <NineGridBoard grid={activeTab.grid} title={activeTab.label} />
            </div>
          </section>

          <section className="min-h-0 overflow-hidden rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,238,252,0.98))] p-4 shadow-soft">
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
      </div>
      <button
        type="button"
        onClick={() => setAiDialogOpen(true)}
        className="fixed bottom-5 left-1/2 z-40 inline-flex -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-r from-plum to-iris px-7 py-3.5 font-display text-base font-bold text-white shadow-soft transition hover:translate-x-[-50%] hover:translate-y-[-1px] sm:bottom-7"
      >
        九宫格AI问答系统
      </button>
      {formValue ? (
        <button
          type="button"
          onClick={handleCreateNewRecord}
          className="fixed bottom-5 right-5 z-40 rounded-full bg-gradient-to-r from-plum to-iris px-5 py-3 font-display text-sm font-bold text-white shadow-soft transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60 sm:bottom-7 sm:right-7"
        >
          新增档案
        </button>
      ) : null}
      {aiDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f1d45]/32 px-3 py-4 backdrop-blur-sm sm:px-5"
          onClick={() => setAiDialogOpen(false)}
        >
          <section
            className="relative flex h-[min(84vh,52rem)] w-full max-w-[min(92vw,70rem)] flex-col overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,243,253,0.96))] shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#eee5f5] px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-plum/55">AI System</p>
                <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">九宫格AI问答系统</h2>
              </div>
              <button
                type="button"
                onClick={() => setAiDialogOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-plum/15 bg-white/88 text-xl font-semibold text-plum transition hover:bg-plum/5"
                aria-label="关闭 AI 问答弹层"
              >
                ×
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-8 text-sm text-ink/42"> </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
