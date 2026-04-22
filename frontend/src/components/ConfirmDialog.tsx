interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "确认删除",
  cancelLabel = "取消",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f1d45]/28 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(249,244,255,0.96))] p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum/55">Danger Action</p>
        <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink">{title}</h2>
        <p className="mt-4 text-sm leading-7 text-ink/65">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-plum/15 bg-white/88 px-4 py-2 text-sm font-semibold text-plum transition hover:bg-plum/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-full border border-rose-200 bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "处理中..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
