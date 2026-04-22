import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BirthForm } from "../components/BirthForm";
import { CASE_FIXTURES, REGION_OPTIONS } from "../fixtures/sampleCases";
import {
  clearBirthFormDraft,
  clearEditingRecordContext,
  consumeNewRecordIntent,
  DEFAULT_FORM_VALUE,
  DEFAULT_REGION_ID,
  loadBirthFormDraft,
  loadEditingRecordContext,
  normalizeBirthFormValue,
  saveBirthFormDraft,
} from "../lib/formState";
import { buildRegionTree, resolveRegionSelection } from "../lib/regionTree";
import { createChartRecord, fetchRegions, updateChartRecord } from "../lib/api";
import { resolveFixtureId } from "../lib/viewModel";
import type { BirthFormValue, ChartRecordDetailResponse, EditingRecordContext, RegionOption } from "../types/models";

interface InputRouteState {
  returnMode?: "restore-input" | "new-record";
  formValue?: BirthFormValue;
}

export function InputPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [formValue, setFormValue] = useState<BirthFormValue>(() => loadBirthFormDraft() ?? DEFAULT_FORM_VALUE);
  const [editingContext, setEditingContext] = useState<EditingRecordContext | null>(() => loadEditingRecordContext());
  const [regions, setRegions] = useState<RegionOption[]>(REGION_OPTIONS);
  const [regionError, setRegionError] = useState<string>("");
  const [regionNotice, setRegionNotice] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const regionTree = useMemo(() => buildRegionTree(regions), [regions]);

  const activeFixture = useMemo(() => {
    const fixtureId = resolveFixtureId(formValue);
    return CASE_FIXTURES.find((item) => item.id === fixtureId) ?? CASE_FIXTURES[0];
  }, [formValue]);

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
    const routeState = (location.state as InputRouteState | undefined) ?? {};
    const shouldStartNew = routeState.returnMode === "new-record" || consumeNewRecordIntent();
    if (shouldStartNew) {
      clearEditingRecordContext();
      setEditingContext(null);
      clearBirthFormDraft();
      setFormValue(DEFAULT_FORM_VALUE);
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
        const nextTree = buildRegionTree(nextRegions);
        const preferredSelection =
          resolveRegionSelection(nextTree, DEFAULT_REGION_ID) ?? resolveRegionSelection(nextTree, nextRegions[0].id);

        if (!preferredSelection) {
          return;
        }

        setRegionNotice(preferredSelection.regionId === DEFAULT_REGION_ID ? "" : "默认地区初始化失败，已自动回退到首个可用地区。");
        setFormValue((current) => {
          const normalizedCurrent = normalizeBirthFormValue(current);
          const currentSelection = resolveRegionSelection(nextTree, normalizedCurrent.regionId);
          return {
            ...normalizedCurrent,
            regionId: currentSelection?.regionId ?? preferredSelection.regionId,
          };
        });
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

  function handlePreset(caseId: string) {
    const fixture = CASE_FIXTURES.find((item) => item.id === caseId);
    if (!fixture) {
      return;
    }
    setFormValue(normalizeBirthFormValue(fixture.formPreset));
  }

  async function handleSubmit() {
    const normalizedFormValue = normalizeBirthFormValue(formValue);
    const hasBirthDate = normalizedFormValue.birthDate.length > 0;
    const hasGender = normalizedFormValue.gender.length > 0;

    if (!hasBirthDate || !hasGender) {
      setSubmitError(!hasBirthDate ? "请选择出生日期后再提交。" : "请选择性别后再提交。");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      let resultDetail: ChartRecordDetailResponse;
      if (editingContext) {
        resultDetail = await updateChartRecord(editingContext.recordId, normalizedFormValue);
        clearEditingRecordContext();
        setEditingContext(null);
      } else {
        resultDetail = await createChartRecord(normalizedFormValue);
      }
      setFormValue(normalizedFormValue);
      navigate("/result", {
        state: {
          formValue: normalizedFormValue,
          payload: resultDetail,
          recordId: resultDetail.id,
          recordAction: editingContext ? "updated" : "created",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "排盘请求失败";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(248,243,253,0.96))] px-6 py-8 shadow-soft sm:px-8 lg:px-10 lg:py-10">
          <div className="absolute -left-12 top-10 h-40 w-40 rounded-full bg-[#efe6fb] blur-3xl" />
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#fbe1d5] blur-3xl" />
          <div className="relative">
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-plum/60">Nine Grid System</p>
              <button
                type="button"
                onClick={() => navigate("/records")}
                className="rounded-full border border-plum/15 bg-white/82 px-4 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5"
              >
                档案管理
              </button>
            </div>
          </div>
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-end">
            <div>
              <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">
                面向真实排盘流程的
                <span className="block text-plum">九宫格排盘系统</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-ink/68">
                基于出生日期、时间与地区经度，计算真太阳时、子时双方案、闰月提示，以及阴格与阳格的完整灵魂结构。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <HeroTag text="真实后端排盘" />
                <HeroTag text="支持子时双方案" />
                <HeroTag text="阴阳格独立结果" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <HeroMetric label="排盘依据" value="真太阳时" detail="结合地区经度与均时差修正" />
              <HeroMetric label="展示能力" value="阴阳双格" detail="主魂、副魂、魄随当前格切换" />
              <HeroMetric label="特殊处理" value="子时 / 闰月" detail="双方案与提示条统一展示" />
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(320px,0.82fr)] lg:items-start">
          <div className="space-y-4">
            {editingContext ? (
              <section className="rounded-[28px] border border-amber-200 bg-amber-50/90 px-5 py-4 text-sm text-amber-900 shadow-sm">
                正在编辑档案 #{editingContext.recordId}。修改原始信息后重新排盘，将直接覆盖该档案。
              </section>
            ) : null}
            <BirthForm
              value={formValue}
              regionTree={regionTree}
              onChange={setFormValue}
              onPreset={handlePreset}
              onSubmit={handleSubmit}
              loading={submitting}
              editing={Boolean(editingContext)}
            />
          </div>

          <aside className="space-y-5">
            <section className="card-surface p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">服务说明</p>
              <div className="space-y-4">
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
              </div>
            </section>

            <section className="card-surface p-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">推荐体验案例</p>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">{activeFixture.title}</h2>
              <p className="mt-3 text-sm leading-6 text-ink/60">{activeFixture.description}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <PreviewRow label="真太阳时" value={activeFixture.summary.trueSolarDatetimeText} />
                <PreviewRow label="子时类型" value={activeFixture.summary.ziHourType} />
                <PreviewRow label="真太阳时辰" value={activeFixture.summary.trueSolarShichen} />
                <PreviewRow label="阳格半补" value={activeFixture.cases[0].charts.yang.halfSupplement} />
              </div>
            </section>

            <section className="card-surface p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">系统状态</p>
              <div className="space-y-3">
                <StatusRow
                  label="地区服务"
                  value={regionError ? "加载异常" : regionNotice ? "初始化异常" : "正常可用"}
                  tone={regionError ? "danger" : regionNotice ? "warning" : "success"}
                />
                <StatusRow label="排盘提交" value={submitError ? "提交失败" : submitting ? "排盘中" : "等待提交"} tone={submitError ? "danger" : submitting ? "warning" : "neutral"} />
                <StatusRow label="结果结构" value="支持方案切换与阴阳双格" tone="success" />
              </div>
              {regionError ? <p className="mt-4 text-sm text-rose-700">地区加载失败：{regionError}</p> : null}
              {regionNotice ? <p className="mt-4 text-sm text-amber-700">地区提示：{regionNotice}</p> : null}
              {submitError ? <p className="mt-3 text-sm text-rose-700">提交失败：{submitError}</p> : null}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#f0e8f6] bg-white/75 p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-plum/50">{label}</p>
      <p className="font-display text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function HeroTag({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-plum/12 bg-white/78 px-4 py-2 text-sm font-semibold text-plum shadow-sm">
      {text}
    </span>
  );
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
    <div className="rounded-[26px] border border-white/80 bg-white/76 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-plum/50">{label}</p>
      <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-ink/58">{detail}</p>
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
    <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-plum text-sm font-bold text-white shadow-sm">
        {index}
      </div>
      <div>
        <p className="font-display text-lg font-bold text-ink">{title}</p>
        <p className="mt-1 text-sm leading-6 text-ink/62">{description}</p>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "neutral";
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
      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClassName}`}>{value}</span>
    </div>
  );
}
