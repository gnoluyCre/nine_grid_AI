// input: 表单组件、批量文本、地区接口、鉴权状态与排盘接口。
// output: 可滚动首页、紧凑顶部服务区与信息录入布局。
// pos: 前端首页页面容器。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BatchExportDialog } from "../components/BatchExportDialog";
import { BirthForm } from "../components/BirthForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { UserAccountPanel } from "../components/UserAccountPanel";
import { useAuth } from "../context/AuthContext";
import { useBatchExport } from "../context/BatchExportContext";
import { REGION_OPTIONS } from "../fixtures/sampleCases";
import {
  clearBirthFormDraft,
  clearEditingRecordContext,
  consumeNewRecordIntent,
  DEFAULT_FORM_VALUE,
  loadBirthFormDraft,
  loadEditingRecordContext,
  normalizeBirthFormValue,
  saveBirthFormDraft,
} from "../lib/formState";
import { parseBatchBirthInput } from "../lib/batchInput";
import { buildRegionTree } from "../lib/regionTree";
import {
  createBatchExport,
  createBirthChart,
  createChartRecord,
  fetchRegions,
  updateChartRecord,
} from "../lib/api";
import type {
  BirthChartApiResponse,
  BirthFormValue,
  BatchChartResultItem,
  ChartRecordDetailResponse,
  EditingRecordContext,
  RegionOption,
} from "../types/models";

interface InputRouteState {
  returnMode?: "restore-input" | "new-record";
  formValue?: BirthFormValue;
}

export function InputPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, refreshUser } = useAuth();
  const { trackedJob, setTrackedJob, downloadTrackedFile, downloadBusy: batchDownloadBusy, isTrackedJobDownloaded } = useBatchExport();
  const [formValue, setFormValue] = useState<BirthFormValue>(() => loadBirthFormDraft() ?? DEFAULT_FORM_VALUE);
  const [editingContext, setEditingContext] = useState<EditingRecordContext | null>(() => loadEditingRecordContext());
  const [regions, setRegions] = useState<RegionOption[]>(REGION_OPTIONS);
  const [regionError, setRegionError] = useState<string>("");
  const [regionNotice, setRegionNotice] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchReplaceConfirmOpen, setBatchReplaceConfirmOpen] = useState(false);
  const [batchStartDate, setBatchStartDate] = useState("");
  const [batchEndDate, setBatchEndDate] = useState("");
  const [batchDialogError, setBatchDialogError] = useState("");
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [batchInputValue, setBatchInputValue] = useState("");
  const [batchInputError, setBatchInputError] = useState("");
  const [batchInputSubmitting, setBatchInputSubmitting] = useState(false);
  const regionTree = useMemo(() => buildRegionTree(regions), [regions]);

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      saveBirthFormDraft(formValue);
    }, 180);

    return () => {
      window.clearTimeout(saveTimer);
    };
  }, [formValue]);

  useEffect(() => {
    if (!editingContext) {
      return;
    }
    setFormValue(editingContext.formValue);
  }, [editingContext]);

  useEffect(() => {
    if (isAuthenticated || !editingContext) {
      return;
    }
    clearEditingRecordContext();
    setEditingContext(null);
  }, [editingContext, isAuthenticated]);

  useEffect(() => {
    setSubmitError("");
  }, [isAuthenticated]);

  useEffect(() => {
    const routeState = (location.state as InputRouteState | undefined) ?? {};
    const shouldStartNew = routeState.returnMode === "new-record" || consumeNewRecordIntent();
    if (shouldStartNew) {
      clearEditingRecordContext();
      setEditingContext(null);
      clearBirthFormDraft();
      setFormValue(DEFAULT_FORM_VALUE);
      setSubmitError("");
      return;
    }

    if (routeState.returnMode === "restore-input" && routeState.formValue) {
      setFormValue(normalizeBirthFormValue(routeState.formValue));
    }
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;

    async function loadRegions() {
      try {
        const nextRegions = await fetchRegions();
        if (cancelled || nextRegions.length === 0) {
          return;
        }
        setRegions(nextRegions);
        setRegionError("");
        setRegionNotice("");
      } catch (error) {
        if (cancelled) {
          return;
        }
        setRegionError(error instanceof Error ? error.message : "地区接口加载失败");
      }
    }

    void loadRegions();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit() {
    const normalizedFormValue = normalizeBirthFormValue(formValue);
    const hasBirthDate = normalizedFormValue.birthDate.length > 0;

    if (!hasBirthDate) {
      setSubmitError("请选择出生日期后再提交。");
      return;
    }

    const preparedFormValue: BirthFormValue = {
      ...normalizedFormValue,
      name: normalizedFormValue.name || buildDefaultRecordName(),
      gender: normalizedFormValue.gender || "未知",
    };

    setSubmitting(true);
    setSubmitError("");

    try {
      let payload: ChartRecordDetailResponse | BirthChartApiResponse;
      let recordId: number | undefined;
      let recordAction: "created" | "updated" | undefined;
      if (editingContext && isAuthenticated) {
        payload = await updateChartRecord(editingContext.recordId, preparedFormValue);
        clearEditingRecordContext();
        setEditingContext(null);
        recordId = payload.id;
        recordAction = "updated";
      } else if (isAuthenticated) {
        payload = await createChartRecord(preparedFormValue);
        recordId = payload.id;
        recordAction = "created";
      } else {
        payload = await createBirthChart(preparedFormValue);
      }
      setFormValue(normalizedFormValue);
      navigate("/result", {
        state: {
          formValue: normalizedFormValue,
          payload,
          recordId,
          recordAction,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "排盘请求失败";
      if (message === "请先登录") {
        const nextUser = await refreshUser();
        if (nextUser) {
          setSubmitError("登录状态已恢复，请重新点击开始排盘。");
          return;
        }
      }
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBatchExportSubmit() {
    if (!batchStartDate || !batchEndDate) {
      setBatchDialogError("请选择开始日期和截止日期后再导出。");
      return;
    }

    if (batchStartDate > batchEndDate) {
      setBatchDialogError("开始日期不能晚于截止日期。");
      return;
    }

    setBatchSubmitting(true);
    setBatchDialogError("");

    try {
      const payload = await createBatchExport({
        startDate: batchStartDate,
        endDate: batchEndDate,
      });
      setTrackedJob(payload);
      setBatchDialogOpen(false);
    } catch (error) {
      setBatchDialogError(error instanceof Error ? error.message : "批量导出创建失败");
      return;
    } finally {
      setBatchSubmitting(false);
    }
  }

  async function handleBatchInputSubmit() {
    const parseResult = parseBatchBirthInput(batchInputValue);
    if (parseResult.errors.length > 0 || parseResult.items.length === 0) {
      setBatchInputError(parseResult.errors.join("；") || "请至少填写一位用户的生日信息。");
      return;
    }

    setBatchInputSubmitting(true);
    setBatchInputError("");

    try {
      const results: BatchChartResultItem[] = [];
      for (const item of parseResult.items) {
        const preparedFormValue: BirthFormValue = {
          ...item.formValue,
          name: item.formValue.name || `批量档案${item.index}`,
          gender: item.formValue.gender || "未知",
        };
        if (isAuthenticated) {
          const payload = await createChartRecord(preparedFormValue);
          results.push({
            formValue: preparedFormValue,
            payload,
            recordId: payload.id,
            recordAction: "created",
          });
        } else {
          const payload = await createBirthChart(preparedFormValue);
          results.push({
            formValue: preparedFormValue,
            payload,
          });
        }
      }

      const firstResult = results[0];
      navigate("/result", {
        state: {
          formValue: firstResult.formValue,
          payload: firstResult.payload,
          recordId: firstResult.recordId,
          recordAction: firstResult.recordAction,
          batchItems: results,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "批量排盘请求失败";
      if (message === "请先登录") {
        const nextUser = await refreshUser();
        if (nextUser) {
          setBatchInputError("登录状态已恢复，请重新点击开始批量排盘。");
          return;
        }
      }
      setBatchInputError(message);
    } finally {
      setBatchInputSubmitting(false);
    }
  }

  async function handleBatchDownload() {
    if (!trackedJob) {
      return;
    }
    try {
      await downloadTrackedFile();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "批量导出文件下载失败");
    }
  }

  function openBatchDialog() {
    if (trackedJob?.status === "running" || trackedJob?.status === "pending") {
      return;
    }
    if (trackedJob?.status === "completed" && trackedJob.downloadReady && !isTrackedJobDownloaded) {
      setBatchReplaceConfirmOpen(true);
      return;
    }
    setBatchDialogError("");
    setBatchDialogOpen(true);
  }

  function closeBatchDialog() {
    if (batchSubmitting) {
      return;
    }
    setBatchDialogOpen(false);
    setBatchDialogError("");
  }

  function confirmReplaceBatchTask() {
    setBatchReplaceConfirmOpen(false);
    setBatchDialogError("");
    setBatchDialogOpen(true);
  }

  const batchStatusMeta = getBatchStatusMeta(trackedJob);
  const batchButtonHint =
    trackedJob?.status === "running" || trackedJob?.status === "pending"
      ? "当前已有批量导出任务正在执行。"
      : trackedJob?.status === "completed" && trackedJob.downloadReady && !isTrackedJobDownloaded
        ? "当前有一份可下载的批量导出文件，继续前会先弹出确认。"
        : undefined;

  return (
    <main className="min-h-screen px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
      <div className="mx-auto max-w-7xl space-y-3">
        <section className="relative overflow-hidden rounded-[22px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,243,253,0.97))] px-4 py-2.5 shadow-soft sm:px-5 lg:px-6">
          <div className="absolute -left-10 top-8 h-28 w-28 rounded-full bg-[#efe6fb] blur-3xl" />
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#fbe1d5] blur-3xl" />
          <div className="relative">
            <div className="mb-2 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-plum/60">Nine Grid System</p>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate(isAuthenticated ? "/records" : "/login", { state: { redirectTo: "/records" } })}
                  className="rounded-full border border-plum/15 bg-white/82 px-4 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5"
                >
                  档案管理
                </button>
                <UserAccountPanel />
              </div>
            </div>
          </div>
          <div className="relative grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(25rem,1.05fr)] lg:items-center">
            <div className="min-w-0 space-y-4">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-[2.55rem]">
                <span className="block text-plum">九宫格排盘系统</span>
              </h1>
              <p className="max-w-3xl text-[15px] leading-7 text-ink/72">
                基于出生日期、时辰和地区信息生成九宫格排盘，自动处理真太阳时、子时、闰月等特殊场景，并集中呈现阴阳格、方案关系与灵魂结构，让单人排盘、多人批量录入和档案管理保持在同一套清晰流程中。
              </p>
            </div>

            <HeroServiceGuide />
          </div>
        </section>

        <section>
          <div className="space-y-4">
            {editingContext ? (
              <section className="rounded-[22px] border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 shadow-sm">
                正在编辑档案 #{editingContext.recordId}。修改原始信息后重新排盘，将直接覆盖该档案。
              </section>
            ) : null}
            <BirthForm
              value={formValue}
              regionTree={regionTree}
              onChange={setFormValue}
              onSubmit={handleSubmit}
              onBatchExport={openBatchDialog}
              batchInputValue={batchInputValue}
              batchInputError={batchInputError}
              batchInputLoading={batchInputSubmitting}
              onBatchInputChange={(nextValue) => {
                setBatchInputValue(nextValue);
                setBatchInputError("");
              }}
              onBatchInputSubmit={handleBatchInputSubmit}
              loading={submitting}
              editing={Boolean(editingContext)}
              batchExportDisabled={trackedJob?.status === "running" || trackedJob?.status === "pending"}
              batchExportHint={batchButtonHint}
              statusPanel={
                <SystemStatusPanel
                  regionError={regionError}
                  regionNotice={regionNotice}
                  submitError={submitError}
                  submitting={submitting}
                  trackedJob={trackedJob}
                  batchStatusMeta={batchStatusMeta}
                  batchDownloadBusy={batchDownloadBusy}
                  onBatchDownload={handleBatchDownload}
                />
              }
            />
          </div>
        </section>
      </div>
      <BatchExportDialog
        open={batchDialogOpen}
        startDate={batchStartDate}
        endDate={batchEndDate}
        loading={batchSubmitting}
        error={batchDialogError}
        onClose={closeBatchDialog}
        onChangeStartDate={setBatchStartDate}
        onChangeEndDate={setBatchEndDate}
        onSubmit={handleBatchExportSubmit}
      />
      <ConfirmDialog
        open={batchReplaceConfirmOpen}
        title="继续新的批量导出？"
        description="当前存在一份尚未下载的批量导出文件。若继续，将开始新的批量导出任务，并把首页状态切换到新任务。旧文件仍会保留到系统自然过期。"
        confirmLabel="继续导出"
        cancelLabel="先不导出"
        loading={false}
        onConfirm={confirmReplaceBatchTask}
        onClose={() => setBatchReplaceConfirmOpen(false)}
      />
    </main>
  );
}

function buildDefaultRecordName() {
  return `档案${Date.now().toString().slice(-4)}`;
}

function HeroServiceGuide() {
  return (
    <section className="rounded-[18px] border border-white/80 bg-white/76 p-2.5 shadow-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">服务说明</p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        <HeroServiceItem title="录入" description="单人或多人文本录入" />
        <HeroServiceItem title="校正" description="真太阳时与特殊日期" />
        <HeroServiceItem title="排盘" description="生成阴阳格结果" />
        <HeroServiceItem title="管理" description="保存、编辑与导出" />
      </div>
    </section>
  );
}

function HeroServiceItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[14px] border border-[#f0e8f6] bg-white/74 px-2.5 py-1.5">
      <p className="font-display text-sm font-bold text-ink">{title}</p>
      <p className="mt-0.5 text-xs leading-4 text-ink/60">{description}</p>
    </div>
  );
}

function SystemStatusPanel({
  regionError,
  regionNotice,
  submitError,
  submitting,
  trackedJob,
  batchStatusMeta,
  batchDownloadBusy,
  onBatchDownload,
}: {
  regionError: string;
  regionNotice: string;
  submitError: string;
  submitting: boolean;
  trackedJob: {
    status: string;
    progressPercent: number;
    processedDays: number;
    totalDays: number;
    currentDate?: string | null;
    downloadReady?: boolean;
    message?: string | null;
  } | null;
  batchStatusMeta: {
    tone: "success" | "warning" | "danger" | "neutral";
    value: string;
  };
  batchDownloadBusy: boolean;
  onBatchDownload: () => void;
}) {
  return (
    <section className="rounded-[20px] border border-[#eee5f5] bg-white/72 p-3.5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">系统状态</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <StatusRow
          label="地区服务"
          tone={regionError ? "danger" : regionNotice ? "warning" : "success"}
          value={regionError ? "加载异常" : regionNotice ? "初始化异常" : "正常可用"}
        />
        <StatusRow
          label="排盘提交"
          tone={submitError ? "danger" : submitting ? "warning" : "neutral"}
          value={submitError ? "提交失败" : submitting ? "排盘中" : "等待提交"}
        />
        <StatusRow label="结果结构" tone="success" value="支持方案切换" />
        <StatusRow
          label="批量导出"
          tone={batchStatusMeta.tone}
          value={batchStatusMeta.value}
          actionLabel={trackedJob?.downloadReady ? (batchDownloadBusy ? "下载中..." : "下载") : undefined}
          onAction={trackedJob?.downloadReady ? onBatchDownload : undefined}
          actionDisabled={!trackedJob?.downloadReady || batchDownloadBusy}
        />
      </div>
      {trackedJob ? (
        <div className="mt-3 rounded-2xl border border-[#f0e8f6] bg-white/72 px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-plum/55">
            <span>批量导出进度</span>
            <span>{trackedJob.progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#efe7f7]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-plum to-iris transition-[width] duration-500"
              style={{ width: `${trackedJob.progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-ink/62">
            已完成 {trackedJob.processedDays} / {trackedJob.totalDays} 天
            {trackedJob.currentDate ? `，当前处理到 ${trackedJob.currentDate}` : ""}
          </p>
        </div>
      ) : null}
      {regionError ? <p className="mt-3 text-sm text-rose-700">地区加载失败：{regionError}</p> : null}
      {regionNotice ? <p className="mt-3 text-sm text-amber-700">地区提示：{regionNotice}</p> : null}
      {submitError ? <p className="mt-3 text-sm text-rose-700">提交失败：{submitError}</p> : null}
      {trackedJob?.status === "failed" && trackedJob.message ? <p className="mt-3 text-sm text-rose-700">批量导出失败：{trackedJob.message}</p> : null}
    </section>
  );
}

function StatusRow({
  label,
  value,
  tone,
  actionLabel,
  onAction,
  actionDisabled = false,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "neutral";
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}) {
  const toneClassName =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : tone === "danger"
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#f0e8f6] bg-white/75 px-3 py-2">
      <p className="text-xs font-medium text-ink/65">{label}</p>
      <div className="flex items-center gap-2">
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            className="rounded-full border border-plum/15 bg-white px-3 py-1 text-xs font-semibold text-plum transition hover:bg-plum/5 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {actionLabel}
          </button>
        ) : null}
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClassName}`}>{value}</span>
      </div>
    </div>
  );
}

function getBatchStatusMeta(job: { status: string; message?: string | null } | null) {
  if (job?.status === "running" || job?.status === "pending") {
    return {
      tone: "warning" as const,
      value: job.status === "pending" ? "待导出" : "导出中",
    };
  }
  if (job?.status === "completed") {
    return {
      tone: "success" as const,
      value: "导出已完成",
    };
  }
  if (job?.status === "failed") {
    return {
      tone: "danger" as const,
      value: "导出失败",
    };
  }
  return {
    tone: "neutral" as const,
    value: "待导出",
  };
}
