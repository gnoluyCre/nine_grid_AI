import { useEffect } from "react";

interface PickerSheetProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  children: React.ReactNode;
}

export function PickerSheet({
  open,
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = "确认选择",
  children,
}: PickerSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="关闭选择器"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <section className="relative z-10 max-h-[86vh] w-full overflow-hidden rounded-t-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,243,253,0.98))] shadow-soft sm:mb-6 sm:max-w-4xl sm:rounded-[32px]">
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-plum/18 sm:hidden" />
        <div className="border-b border-line/75 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-plum/55">信息选择</p>
              <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink">{title}</h3>
              {description ? <p className="mt-2 text-sm leading-6 text-ink/62">{description}</p> : null}
            </div>
            <button type="button" onClick={onClose} className="picker-icon-button hidden sm:inline-flex">
              关闭
            </button>
          </div>
        </div>
        <div className="max-h-[calc(86vh-10rem)] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        <div className="flex items-center gap-3 border-t border-line/75 bg-white/88 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="picker-secondary-button flex-1">
            取消
          </button>
          <button type="button" onClick={onConfirm ?? onClose} className="picker-primary-button flex-1">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
