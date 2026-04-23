// input: 打开状态、日期范围、提交回调与错误文案。
// output: 首页批量测算的日期范围选择弹层。
// pos: 前端批量导出交互弹层。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
interface BatchExportDialogProps {
  open: boolean;
  startDate: string;
  endDate: string;
  loading: boolean;
  error: string;
  onClose: () => void;
  onChangeStartDate: (value: string) => void;
  onChangeEndDate: (value: string) => void;
  onSubmit: () => void;
}

export function BatchExportDialog({
  open,
  startDate,
  endDate,
  loading,
  error,
  onClose,
  onChangeStartDate,
  onChangeEndDate,
  onSubmit,
}: BatchExportDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f1d45]/32 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <section
        className="w-full max-w-xl rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,243,253,0.96))] p-6 shadow-soft sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-plum/55">Batch Export</p>
            <h2 className="mt-1.5 font-display text-[1.8rem] font-extrabold tracking-tight text-ink">批量测算</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">选择开始日期和截止日期后，系统会按天批量计算并导出 xlsx。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-plum/12 bg-white/80 text-xl text-plum transition hover:bg-plum/6"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-plum/55">开始日期</span>
            <input
              type="date"
              className="field-shell w-full"
              value={startDate}
              onChange={(event) => onChangeStartDate(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-plum/55">截止日期</span>
            <input
              type="date"
              className="field-shell w-full"
              value={endDate}
              onChange={(event) => onChangeEndDate(event.target.value)}
            />
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-plum/15 bg-white/82 px-5 py-2.5 text-sm font-semibold text-plum transition hover:bg-plum/5"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-plum to-iris px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? "提交中..." : "开始计算并导出"}
          </button>
        </div>
      </section>
    </div>
  );
}
