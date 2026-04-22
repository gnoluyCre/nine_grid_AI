import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { deleteChartRecord, fetchChartRecordDetail, fetchChartRecords } from "../lib/api";
import { saveEditingRecordContext, saveNewRecordIntent } from "../lib/formState";
import type { ChartRecordListItem } from "../types/models";

const PAGE_SIZE = 10;

export function RecordsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ChartRecordListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyRecordId, setBusyRecordId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChartRecordListItem | null>(null);

  function handleCreateNewRecord() {
    saveNewRecordIntent();
    navigate("/", {
      state: {
        returnMode: "new-record",
      },
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      setLoading(true);
      setError("");
      try {
        const response = await fetchChartRecords(page, PAGE_SIZE);
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
        setError(nextError instanceof Error ? nextError.message : "档案列表加载失败");
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
  }, [page]);

  async function handleEdit(recordId: number) {
    setBusyRecordId(recordId);
    setError("");
    try {
      const detail = await fetchChartRecordDetail(recordId);
      saveEditingRecordContext({
        recordId,
        formValue: {
          name: detail.name ?? "",
          gender: detail.gender,
          birthDate: detail.birthDate,
          birthTime: detail.birthTime,
          regionId: detail.regionId,
        },
      });
      navigate("/");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "档案读取失败");
    } finally {
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
        const response = await fetchChartRecords(page, PAGE_SIZE);
        setItems(response.items);
        setTotal(response.total);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "档案删除失败");
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
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-full border border-plum/15 bg-white/82 px-4 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5"
            >
              返回首页
            </button>
          </div>
          <div className="mt-4 flex justify-end">
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
                当前还没有已保存档案。
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="rounded-[28px] border border-line/80 bg-white/82 p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum/50">档案 #{item.id}</p>
                      <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">
                        {item.name || "未命名档案"}
                      </h2>
                      <p className="mt-2 text-sm text-ink/60">
                        {item.birthDate} · {item.gender} · {item.ziHourType}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item.id)}
                        disabled={busyRecordId === item.id}
                        className="rounded-full border border-plum/15 bg-white px-4 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyRecordId === item.id ? "处理中..." : "编辑档案"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        disabled={busyRecordId === item.id}
                        className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        删除档案
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 rounded-[24px] border border-[#f0e8f6] bg-[#fbf8ff] p-4">
                    <SummaryLine label="阳格" value={`${item.firstCaseYangDigitString}/${item.firstCaseYangMissingDigits}`} />
                    <SummaryLine label="阴格" value={`${item.firstCaseYinDigitString}/${item.firstCaseYinMissingDigits}`} />
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
    </main>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/80 px-4 py-3">
      <span className="text-sm font-semibold text-plum">{label}</span>
      <span className="font-display text-lg font-bold tracking-tight text-ink">{value}</span>
    </div>
  );
}
