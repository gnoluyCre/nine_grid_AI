// input: 打开状态、标题文案与关闭回调。
// output: 批量导出完成后的全局提醒弹层。
// pos: 前端批量任务完成提醒组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
interface BatchExportNoticeDialogProps {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
}

export function BatchExportNoticeDialog({ open, title, description, onClose }: BatchExportNoticeDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#2f1d45]/28 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(249,244,255,0.96))] p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum/55">Batch Export</p>
        <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink">{title}</h2>
        <p className="mt-4 text-sm leading-7 text-ink/65">{description}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gradient-to-r from-plum to-iris px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:translate-y-[-1px]"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
