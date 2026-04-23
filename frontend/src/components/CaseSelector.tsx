// input: CaseSelectorViewModel 与切换回调。
// output: 极低高度的排盘结果案例切换器，不再显示日期关系标签。
// pos: 结果页的案例导航组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import type { CaseSelectorViewModel } from "../types/models";

interface CaseSelectorProps {
  value: CaseSelectorViewModel;
  onSelect: (index: number) => void;
}

export function CaseSelector({ value, onSelect }: CaseSelectorProps) {
  if (value.caseCount <= 1) {
    return null;
  }

  return (
    <section className="rounded-[20px] border border-white/80 bg-white/78 px-3 py-2.5 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-2">
        {value.items.map((item) => {
          const active = item.index === value.activeCaseIndex;

          return (
            <button
              key={item.index}
              type="button"
              onClick={() => onSelect(item.index)}
              className={`rounded-[16px] border px-3 py-2 text-left transition ${
                active
                  ? "border-plum/30 bg-gradient-to-r from-plum to-iris text-white shadow-soft"
                  : "border-[#eee5f5] bg-white/80 text-ink hover:border-plum/20 hover:bg-plum/5"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${active ? "text-white/72" : "text-plum/60"}`}>
                  {item.label}
                </p>
                <p className={`text-[11px] ${active ? "text-white/78" : "text-ink/55"}`}>{item.solarBirthday}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
