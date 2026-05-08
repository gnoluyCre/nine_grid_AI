// input: GridBoardViewModel 与标题文本。
// output: 显示对应格/缺漏数字的自适应九宫格面板。
// pos: 前端结果页的核心图表组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import type { GridBoardViewModel } from "../types/models";
import { GridCell } from "./GridCell";

interface NineGridBoardProps {
  grid: GridBoardViewModel;
  title: string;
}

export function NineGridBoard({ grid, title }: NineGridBoardProps) {
  const gridCode = `${grid.digitString || "—"}/${grid.missingDigits || "—"}`;

  return (
    <section className="card-surface relative flex h-full min-h-0 flex-col overflow-hidden p-2.5">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -left-20 -top-16 h-52 w-52 rounded-full border border-[#6d5fec]/10" />
        <div className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full border border-[#6d5fec]/10" />
      </div>
      <div className="relative">
        <div className="mb-1.5 text-center">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-[#6d5fec]/65">{title}</p>
          <p className="mt-0.5 font-display text-[clamp(0.95rem,1.75vw,1.55rem)] font-extrabold tracking-[0.08em] text-[#6d5fec]/48">
            {gridCode}
          </p>
        </div>

        <div className="mx-auto w-full max-w-[min(100%,44vh,28rem)] overflow-hidden rounded-[16px] bg-[#786af0]/85 p-px shadow-sm">
          <div className="grid grid-cols-3 gap-px bg-[#786af0]/70">
            {grid.cells.map((cell) => (
              <GridCell key={cell.id} cell={cell} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
