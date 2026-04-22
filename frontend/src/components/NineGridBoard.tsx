import type { GridBoardViewModel } from "../types/models";
import { GridCell } from "./GridCell";

interface NineGridBoardProps {
  grid: GridBoardViewModel;
  title: string;
}

export function NineGridBoard({ grid, title }: NineGridBoardProps) {
  return (
    <section className="card-surface relative overflow-hidden p-4 sm:p-5">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -left-20 -top-16 h-52 w-52 rounded-full border border-[#6d5fec]/10" />
        <div className="absolute -bottom-16 -right-16 h-40 w-40 rounded-full border border-[#6d5fec]/10" />
      </div>
      <div className="relative">
        <div className="mb-4 text-center">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-[#6d5fec]/65">{title}</p>
          <p className="mt-2 font-display text-[clamp(1.8rem,3.3vw,3.2rem)] font-extrabold tracking-[0.14em] text-[#6d5fec]/42">
            {grid.digitString}
          </p>
        </div>

        <div className="mx-auto w-full max-w-[clamp(18rem,42vw,37rem)] overflow-hidden rounded-[24px] bg-[#786af0]/85 p-px shadow-sm">
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
