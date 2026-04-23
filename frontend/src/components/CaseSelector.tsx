// input: CaseSelectorViewModel 与切换回调。
// output: 排盘结果页的案例切换器。
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
    <section className="card-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-plum/55">方案切换</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {value.items.map((item) => {
          const active = item.index === value.activeCaseIndex;

          return (
            <button
              key={item.index}
              type="button"
              onClick={() => onSelect(item.index)}
              className={`rounded-[24px] border px-4 py-4 text-left transition ${
                active
                  ? "border-plum/30 bg-gradient-to-r from-plum to-iris text-white shadow-soft"
                  : "border-[#eee5f5] bg-white/80 text-ink hover:border-plum/20 hover:bg-plum/5"
              }`}
            >
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${active ? "text-white/70" : "text-plum/60"}`}>
                {item.label}
              </p>
              <p className="mt-2 font-display text-lg font-extrabold">{item.dateRelation}</p>
              <p className={`mt-1 text-sm ${active ? "text-white/80" : "text-ink/55"}`}>{item.solarBirthday}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
