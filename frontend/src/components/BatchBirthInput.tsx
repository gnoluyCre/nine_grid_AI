// input: 批量排盘文本、解析状态、提交状态与回调。
// output: 固定高度、等高提示区和美化滚动条的多人手动录入框。
// pos: 首页出生信息表单下方的批量排盘录入组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import { useMemo } from "react";
import { parseBatchBirthInput } from "../lib/batchInput";

interface BatchBirthInputProps {
  value: string;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function BatchBirthInput({
  value,
  loading = false,
  disabled = false,
  error = "",
  onChange,
  onSubmit,
}: BatchBirthInputProps) {
  const parseResult = useMemo(() => parseBatchBirthInput(value), [value]);
  const hasContent = value.trim().length > 0;
  const canSubmit = hasContent && parseResult.items.length > 0 && parseResult.errors.length === 0 && !loading && !disabled;

  return (
    <section className="rounded-[22px] border border-[#eee5f5] bg-white/72 p-3.5 sm:p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">批量排盘</p>
          <h3 className="mt-1 font-display text-lg font-extrabold tracking-tight text-ink">多人信息一次录入</h3>
        </div>
        <span className="rounded-full border border-plum/10 bg-plum/5 px-3 py-1 text-xs font-semibold text-plum/78">
          {hasContent ? `已识别 ${parseResult.items.length} 位` : "多个用户用空行隔开"}
        </span>
      </div>

      <div className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <label className="block h-[9.5rem]">
          <span className="sr-only">批量排盘文本</span>
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={"小明\n20000909\n5:30\n\n小红\n1999年9月3日\n下午2点15分"}
            className="batch-input-scroll h-full w-full resize-none rounded-[18px] border border-[#e8deef] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(251,248,253,0.98))] px-4 py-3 text-sm leading-6 text-ink shadow-sm outline-none transition placeholder:text-ink/34 focus:border-plum focus:ring-2 focus:ring-plum/10"
            disabled={loading || disabled}
          />
        </label>

        <aside className="flex h-[9.5rem] flex-col overflow-hidden rounded-[18px] border border-[#efe7f7] bg-[#fbf8fd] p-3 text-sm text-ink/62">
          <p className="font-semibold text-ink">可参考以下格式填写，多个用户使用空行隔开</p>
          <div className="mt-2 space-y-1 rounded-2xl bg-white/80 p-2.5 font-mono text-xs leading-5 text-ink/70">
            <p>档案名（可选）：小明</p>
            <p>生日：20000909</p>
            <p>时间(24h制 可选)：5:30</p>
          </div>
          <p className="mt-2 min-h-0 overflow-y-auto pr-1 text-xs leading-5">
            支持数字、横线、中文日期，以及 5:30、0530、下午2点等时间格式。
          </p>
        </aside>
      </div>

      {parseResult.errors.length > 0 ? (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {parseResult.errors.join("；")}
        </div>
      ) : null}
      {error ? <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink/52">批量排盘会逐条复用当前排盘接口；登录后会同步保存为档案。</p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="rounded-full bg-gradient-to-r from-plum to-iris px-5 py-2.5 font-display text-sm font-bold text-white shadow-soft transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
        >
          {loading ? "批量排盘中..." : "开始批量排盘"}
        </button>
      </div>
    </section>
  );
}
