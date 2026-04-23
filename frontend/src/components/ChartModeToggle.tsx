// input: 当前阴阳格模式与切换回调。
// output: 阳格/阴格切换按钮。
// pos: 结果页图表模式切换组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import type { ChartMode } from "../types/models";

interface ChartModeToggleProps {
  mode: ChartMode;
  onChange: (mode: ChartMode) => void;
}

export function ChartModeToggle({ mode, onChange }: ChartModeToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-plum/10 bg-white/80 p-1 shadow-sm">
      {(["yang", "yin"] as const).map((item) => {
        const active = item === mode;
        const label = item === "yang" ? "阳格" : "阴格";

        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={`rounded-full px-5 py-2 text-sm font-display font-bold transition ${
              active ? "bg-plum text-white shadow-sm" : "text-ink/55 hover:text-plum"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
