interface SubmitActionProps {
  onSubmit: () => void;
  loading?: boolean;
}

export function SubmitAction({ onSubmit, loading = false }: SubmitActionProps) {
  return (
    <div className="mt-8 flex flex-col gap-3 border-t border-[#eee5f5] pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-lg text-sm text-ink/55">
        提交后将生成真实排盘结果，并进入结果页查看详细信息。
      </p>
      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="rounded-full bg-gradient-to-r from-plum to-iris px-6 py-3 font-display text-sm font-bold text-white shadow-soft transition hover:translate-y-[-1px]"
      >
        {loading ? "排盘中..." : "开始排盘"}
      </button>
    </div>
  );
}
