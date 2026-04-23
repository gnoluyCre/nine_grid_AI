// input: 按钮文案、禁用状态与点击回调。
// output: 统一风格的提交操作区与提交按钮状态。
// pos: 表单提交动作组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
interface SubmitActionProps {
  onSubmit: () => void;
  onSecondaryAction?: () => void;
  loading?: boolean;
  editing?: boolean;
  disabled?: boolean;
  secondaryLabel?: string;
  secondaryDisabled?: boolean;
  secondaryHint?: string;
}

export function SubmitAction({
  onSubmit,
  onSecondaryAction,
  loading = false,
  editing = false,
  disabled = false,
  secondaryLabel,
  secondaryDisabled = false,
  secondaryHint = "",
}: SubmitActionProps) {
  return (
    <div className="mt-8 flex flex-col gap-3 border-t border-[#eee5f5] pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-lg text-sm text-ink/55">
        {editing ? "重新排盘后会覆盖当前档案，并进入结果页查看最新结果。" : "提交后将生成真实排盘结果，并进入结果页查看详细信息。"}
      </p>
      <div className="flex flex-col items-end gap-2">
        <div className="flex flex-wrap items-center justify-end gap-3">
          {secondaryLabel && onSecondaryAction ? (
            <button
              type="button"
              onClick={onSecondaryAction}
              disabled={secondaryDisabled}
              className="rounded-full border border-plum/18 bg-white/88 px-5 py-2.5 text-sm font-semibold text-plum transition hover:bg-plum/5 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {secondaryLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled}
            className="rounded-full bg-gradient-to-r from-plum to-iris px-6 py-3 font-display text-sm font-bold text-white shadow-soft transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
          >
            {loading ? (editing ? "更新中..." : "排盘中...") : editing ? "更新档案并排盘" : "开始排盘"}
          </button>
        </div>
        {secondaryHint ? <p className="text-right text-xs text-ink/52">{secondaryHint}</p> : null}
      </div>
    </div>
  );
}
