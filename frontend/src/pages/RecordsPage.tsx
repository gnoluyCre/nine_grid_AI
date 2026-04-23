// input: 鉴权状态、档案 API、路由跳转与详情/确认弹窗组件。
// output: 含特殊案例标签与居中操作栏的紧凑档案列表。
// pos: 前端档案管理页面容器。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { RecordDetailDialog } from "../components/RecordDetailDialog";
import { UserAccountPanel } from "../components/UserAccountPanel";
import { useAuth } from "../context/AuthContext";
import { deleteChartRecord, fetchChartRecordDetail, fetchChartRecords } from "../lib/api";
import { saveEditingRecordContext, saveNewRecordIntent } from "../lib/formState";
import { formatShichenLabel, formatUnknownDisplay, UNKNOWN_DISPLAY } from "../lib/shichen";
import type { ChartRecordDetailResponse, ChartRecordListItem, ChartRecordSearchParams } from "../types/models";

const PAGE_SIZE = 10;

export function RecordsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, authLoading, refreshUser } = useAuth();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ChartRecordListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyRecordId, setBusyRecordId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChartRecordListItem | null>(null);
  const [detailTargetId, setDetailTargetId] = useState<number | null>(null);
  const [detailPayload, setDetailPayload] = useState<ChartRecordDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchParams, setSearchParams] = useState<ChartRecordSearchParams>({});

  function handleCreateNewRecord() {
    saveNewRecordIntent();
    navigate("/", {
      state: {
        returnMode: "new-record",
      },
    });
  }

  function buildSearchParams(keyword: string): ChartRecordSearchParams {
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) {
      return {};
    }
    if (/^\d+$/.test(normalizedKeyword)) {
      return {
        digitString: normalizedKeyword,
      };
    }
    return {
      name: normalizedKeyword,
    };
  }

  function reloadRecords(nextPage: number, nextSearchParams: ChartRecordSearchParams) {
    return fetchChartRecords(nextPage, PAGE_SIZE, nextSearchParams);
  }

  function handleSearch() {
    const nextSearchParams = buildSearchParams(searchInput);
    setError("");
    setSearchParams(nextSearchParams);
    setPage(1);
  }

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!isAuthenticated) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;

    async function loadRecords() {
      setLoading(true);
      setError("");
      try {
        const response = await reloadRecords(page, searchParams);
        if (cancelled) {
          return;
        }
        setItems(response.items);
        setTotal(response.total);
        if (page > 1 && response.items.length === 0) {
          setPage((current) => Math.max(1, current - 1));
          return;
        }
      } catch (nextError) {
        if (cancelled) {
          return;
        }
        const message = nextError instanceof Error ? nextError.message : "档案列表加载失败";
        if (message === "请先登录") {
          const nextUser = await refreshUser();
          if (nextUser) {
            setError("登录状态已恢复，正在重新同步档案列表。");
            return;
          }
        }
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRecords();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, page, searchParams]);

  async function handleEdit(recordId: number) {
    setBusyRecordId(recordId);
    setError("");
    try {
      const detail = await fetchChartRecordDetail(recordId);
      saveEditingRecordContext({
        recordId,
        formValue: {
          name: detail.name ?? "",
          gender: detail.gender === UNKNOWN_DISPLAY ? "" : detail.gender,
          birthDate: detail.birthDate,
          birthTime: detail.birthTime,
          regionId: detail.regionId,
        },
      });
      navigate("/");
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "档案读取失败";
      if (message === "请先登录") {
        const nextUser = await refreshUser();
        if (nextUser) {
          setError("登录状态已恢复，请重新打开该档案。");
          return;
        }
      }
      setError(message);
    } finally {
      setBusyRecordId(null);
    }
  }

  async function handleViewDetail(recordId: number) {
    setBusyRecordId(recordId);
    setDetailTargetId(recordId);
    setDetailLoading(true);
    setDetailError("");
    setDetailPayload(null);
    setError("");
    try {
      const detail = await fetchChartRecordDetail(recordId);
      setDetailPayload(detail);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "档案详情加载失败";
      if (message === "请先登录") {
        const nextUser = await refreshUser();
        if (nextUser) {
          setDetailError("登录状态已恢复，请重新打开详情。");
          return;
        }
      }
      setDetailError(message);
    } finally {
      setDetailLoading(false);
      setBusyRecordId(null);
    }
  }

  async function handleDelete(recordId: number) {
    setBusyRecordId(recordId);
    setError("");
    try {
      await deleteChartRecord(recordId);
      setDeleteTarget(null);
      const remainingOnPage = items.length - 1;
      if (remainingOnPage <= 0 && page > 1) {
        setPage((current) => current - 1);
      } else {
        const response = await reloadRecords(page, searchParams);
        setItems(response.items);
        setTotal(response.total);
      }
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "档案删除失败";
      if (message === "请先登录") {
        const nextUser = await refreshUser();
        if (nextUser) {
          setError("登录状态已恢复，请重新执行删除操作。");
          return;
        }
      }
      setError(message);
    } finally {
      setBusyRecordId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="card-surface p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-plum/60">Archive Center</p>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">档案管理</h1>
              <p className="mt-3 text-sm leading-6 text-ink/62">查看已保存档案，支持回填编辑和删除。</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="rounded-full border border-plum/15 bg-white/82 px-4 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5"
              >
                返回首页
              </button>
              <UserAccountPanel />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-[18rem] flex-1 flex-wrap items-center gap-3">
              <input
                className="field-shell min-w-[16rem] flex-1"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="输入档案名称或者阴阳格可快速查找档案"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="rounded-full border border-plum/15 bg-white/82 px-5 py-2.5 text-sm font-semibold text-plum transition hover:bg-plum/5"
              >
                搜索
              </button>
            </div>
            <button
              type="button"
              onClick={handleCreateNewRecord}
              className="rounded-full bg-gradient-to-r from-plum to-iris px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:translate-y-[-1px]"
            >
              新增档案
            </button>
          </div>
        </section>

        {error ? (
          <section className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </section>
        ) : null}

        <section className="card-surface p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink/72">共 {total} 条档案</p>
              <p className="text-xs text-ink/48">每页 10 条，最新添加优先展示</p>
            </div>

          <div className="max-h-[68vh] space-y-4 overflow-y-auto pr-1">
            {loading ? (
              <div className="rounded-[24px] border border-line/80 bg-white/78 px-4 py-8 text-center text-sm text-ink/55">
                档案加载中...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[24px] border border-line/80 bg-white/78 px-4 py-8 text-center text-sm text-ink/55">
                {searchParams.name || searchParams.digitString ? "未找到符合当前搜索条件的档案。" : "当前还没有已保存档案。"}
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-line/80 bg-white/88 px-5 py-4 shadow-sm">
                  <div className="flex gap-6">
                    <div className="min-w-0 basis-2/3">
                      <div className="flex min-w-0 items-center gap-3">
                        <h2 className="truncate font-display text-[2rem] font-extrabold tracking-tight text-ink">
                          {item.name || "未命名档案"}
                        </h2>
                        <TagBadge tone={resolveGenderTone(item.gender)}>{formatUnknownDisplay(item.gender)}</TagBadge>
                        {resolveSpecialCaseLabel(item) ? <TagBadge tone="amber">{resolveSpecialCaseLabel(item)}</TagBadge> : null}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-x-10 gap-y-3">
                        <div className="space-y-3">
                          <RecordInfoRow label="阳历" value={joinDateAndShichen(item.firstCaseSolarBirthday, item.trueSolarShichen)} />
                          <RecordInfoRow label="阴历" value={joinDateAndShichen(item.firstCaseLunarBirthday, item.trueSolarShichen)} />
                        </div>
                        <div className="space-y-3">
                          <RecordInfoRow label="阳格" value={`${item.firstCaseYangDigitString}/${item.firstCaseYangMissingDigits}`} />
                          <RecordInfoRow label="阴格" value={`${item.firstCaseYinDigitString}/${item.firstCaseYinMissingDigits}`} />
                        </div>
                      </div>
                    </div>

                    <div className="basis-1/3 shrink-0 self-center">
                      <div className="flex w-full items-center justify-end">
                        <div className="flex w-full flex-nowrap justify-end gap-2 rounded-[22px] border border-line/80 bg-[#fbf8ff] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                          <button
                            type="button"
                            onClick={() => void handleViewDetail(item.id)}
                            disabled={busyRecordId === item.id}
                            className="whitespace-nowrap rounded-full border border-plum/15 bg-white px-4 py-2 text-sm font-semibold text-plum shadow-sm transition hover:bg-plum/5 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {busyRecordId === item.id && detailTargetId === item.id && detailLoading ? "加载中..." : "查看详情"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(item.id)}
                            disabled={busyRecordId === item.id}
                            className="whitespace-nowrap rounded-full border border-plum/15 bg-white px-4 py-2 text-sm font-semibold text-plum shadow-sm transition hover:bg-plum/5 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {busyRecordId === item.id ? "处理中..." : "编辑档案"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            disabled={busyRecordId === item.id}
                            className="whitespace-nowrap rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            删除档案
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1 || loading}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-plum/20 hover:bg-plum/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              上一页
            </button>
            <p className="text-sm text-ink/58">
              第 {page} / {totalPages} 页
            </p>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-plum/20 hover:bg-plum/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              下一页
            </button>
          </div>
        </section>
      </div>
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="确认删除档案"
        description={`删除后不能恢复，请谨慎删除${deleteTarget?.name ? `“${deleteTarget.name}”` : "当前档案"}。`}
        confirmLabel="确认删除"
        loading={busyRecordId === deleteTarget?.id}
        onClose={() => {
          if (!busyRecordId) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => {
          if (deleteTarget) {
            void handleDelete(deleteTarget.id);
          }
        }}
      />
      <RecordDetailDialog
        open={detailTargetId !== null}
        payload={detailPayload}
        loading={detailLoading}
        error={detailError}
        onClose={() => {
          if (!detailLoading) {
            setDetailTargetId(null);
            setDetailPayload(null);
            setDetailError("");
          }
        }}
      />
    </main>
  );
}

function RecordInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 text-[15px] leading-7 text-ink/62">
      <span className="shrink-0 font-medium text-ink/68">{label}:</span>
      <span className="min-w-0 truncate text-[1.05rem] font-medium text-ink">{value}</span>
    </div>
  );
}

function joinDateAndShichen(dateText: string, shichen: string) {
  const shichenLabel = formatShichenLabel(shichen);
  return `${dateText} ${shichenLabel}`;
}

function resolveSpecialCaseLabel(item: ChartRecordListItem) {
  const tokens: string[] = [];

  if (item.ziHourType === "前子时" || item.ziHourType === "后子时") {
    tokens.push(item.ziHourType);
  }
  if (item.hasLunarLeapCase) {
    tokens.push("闰月");
  }

  return tokens.length > 0 ? tokens.join(" · ") : "";
}

function resolveGenderTone(gender: string) {
  if (gender === "女") {
    return "pink" as const;
  }
  if (gender === "男") {
    return "blue" as const;
  }
  return "slate" as const;
}

function TagBadge({ children, tone }: { children: string; tone: "blue" | "pink" | "amber" | "slate" }) {
  const className =
    tone === "blue"
      ? "bg-[#3278eb] text-white"
      : tone === "pink"
        ? "bg-[#ffedf5] text-[#e14b8f]"
        : tone === "amber"
          ? "bg-[#fff3df] text-[#e69019]"
          : "bg-[#eef2f7] text-[#64748b]";

  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-lg font-semibold leading-none ${className}`}>
      {children}
    </span>
  );
}
