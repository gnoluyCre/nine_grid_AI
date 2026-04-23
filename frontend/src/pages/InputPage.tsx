// input: 表单组件、地区接口、鉴权状态与排盘接口。
// output: 精简后的首页简介、录入、服务说明与旧版风格系统状态布局。
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
  const regionTree = useMemo(() => buildRegionTree(regions), [regions]);

  useEffect(() => {
    saveBirthFormDraft(formValue);
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
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="relative overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,243,253,0.97))] px-5 py-5 shadow-soft sm:px-7 lg:px-8 lg:py-6">
          <div className="absolute -left-10 top-8 h-28 w-28 rounded-full bg-[#efe6fb] blur-3xl" />
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#fbe1d5] blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between gap-4">
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
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.8fr)] lg:items-center">
            <div className="min-w-0">
              <h1 className="max-w-3xl font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl lg:text-[3.1rem]">
                <span className="block text-plum">九宫格排盘系统</span>
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/68 sm:text-[15px]">
                九宫格又被称为“人生说明书”，起源于奇门遁甲，河图洛书。每个人因其出生日期和时辰不同，出生时地磁角和黄赤交角与月亮，木星，太阳夹角的角度决定了身体脏腑器官对于磁和波的接受能力，从而决定了各个脏腑器官有不同状态，这也影响了人们的个性和天赋。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <HeroMetric label="排盘依据" value="真太阳时" detail="结合地区经度与均时差修正" />
              <HeroMetric label="展示能力" value="阴阳双格" detail="主魂、副魂、魄随当前格切换" />
              <HeroMetric label="特殊处理" value="子时 / 闰月" detail="双方案与提示条统一展示" />
              <HeroMetric label="AI 系统" value="预留能力" detail="后续版本接入智能分析与辅助解读" />
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.72fr)] lg:items-stretch">
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
              loading={submitting}
              editing={Boolean(editingContext)}
              batchExportDisabled={trackedJob?.status === "running" || trackedJob?.status === "pending"}
              batchExportHint={batchButtonHint}
            />
          </div>

          <aside className="flex h-full flex-col gap-4">
            <section className="card-surface flex-1 p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">服务说明</p>
              <div className="flex h-[calc(100%-2rem)] flex-col justify-between gap-4">
                <ProductStep
                  index="01"
                  title="录入出生信息"
                  description="填写公历生日、出生时间、地区与基础资料，系统将按真实接口返回结果。 "
                />
                <ProductStep
                  index="02"
                  title="生成方案结果"
                  description="系统自动判定当前日期、前后子时关系和农历闰月情况，生成一套或两套方案。"
                />
                <ProductStep
                  index="03"
                  title="查看阴阳格"
                  description="在结果页切换阳格或阴格时，主魂、副魂、魄、缺漏与半补会同步切换。"
                />
                <ProductStep
                  index="04"
                  title="AI 解读"
                  description="预留 AI 解读能力，后续支持自动分析个性、天赋与参考说明。"
                />
              </div>
            </section>
            <section className="card-surface mt-auto p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">系统状态</p>
              <div className="space-y-3">
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
                <StatusRow
                  label="结果结构"
                  tone="success"
                  value="支持方案切换与阴阳双格"
                />
                <StatusRow
                  label="批量导出状态"
                  tone={batchStatusMeta.tone}
                  value={batchStatusMeta.value}
                  actionLabel={trackedJob?.downloadReady ? (batchDownloadBusy ? "下载中..." : "下载") : undefined}
                  onAction={trackedJob?.downloadReady ? handleBatchDownload : undefined}
                  actionDisabled={!trackedJob?.downloadReady || batchDownloadBusy}
                />
                {trackedJob ? (
                  <div className="rounded-2xl border border-[#f0e8f6] bg-white/72 px-4 py-3">
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
              </div>
              {regionError ? <p className="mt-4 text-sm text-rose-700">地区加载失败：{regionError}</p> : null}
              {regionNotice ? <p className="mt-4 text-sm text-amber-700">地区提示：{regionNotice}</p> : null}
              {submitError ? <p className="mt-3 text-sm text-rose-700">提交失败：{submitError}</p> : null}
              {trackedJob?.status === "failed" && trackedJob.message ? <p className="mt-3 text-sm text-rose-700">批量导出失败：{trackedJob.message}</p> : null}
            </section>
          </aside>
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

function HeroMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/80 bg-white/78 px-4 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-plum/50">{label}</p>
      <p className="mt-1.5 font-display text-xl font-extrabold tracking-tight text-ink">{value}</p>
      <p className="mt-1.5 text-sm leading-5 text-ink/58">{detail}</p>
    </div>
  );
}

function ProductStep({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid grid-cols-[2.6rem_minmax(0,1fr)] gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-plum text-sm font-bold text-white shadow-sm">
        {index}
      </div>
      <div>
        <p className="font-display text-[1.05rem] font-bold text-ink">{title}</p>
        <p className="mt-1 text-sm leading-5 text-ink/62">{description}</p>
      </div>
    </div>
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
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#f0e8f6] bg-white/75 px-4 py-3">
      <p className="text-sm font-medium text-ink/65">{label}</p>
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
