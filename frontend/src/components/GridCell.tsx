// input: 单个九宫格单元格视图模型。
// output: 单格视觉渲染结果。
// pos: 九宫格棋盘的最小显示单元。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import type { GridCellViewModel } from "../types/models";

interface GridCellProps {
  cell: GridCellViewModel;
}

const CELL_COLOR_MAP: Record<number, string> = {
  0: "#d7d0fb",
  1: "#fffdfb",
  2: "#fffdfb",
  3: "#ff8188",
  4: "#d9ffc9",
  5: "#d9ffc9",
  6: "#d7d0fb",
  7: "#ffe7a3",
  8: "#ffe7a3",
  9: "#ffe7a3",
};

export function GridCell({ cell }: GridCellProps) {
  if (cell.isPlaceholder) {
    return <div className="aspect-square min-h-0 bg-[#fffdfb]" />;
  }

  return (
    <div className="relative aspect-square min-h-0 overflow-hidden" style={{ backgroundColor: CELL_COLOR_MAP[cell.cellNumber!] }}>
      {cell.subSoulCount > 0 ? (
        <div className="absolute left-2 top-2 flex items-center gap-1">
          {Array.from({ length: cell.subSoulCount }).map((_, index) => (
            <span
              key={`sub-${cell.id}-${index}`}
              className="h-0 w-0 border-l-[6px] border-r-[6px] border-b-[9px] border-l-transparent border-r-transparent border-b-[#6d5fec] drop-shadow-[0_1px_1px_rgba(109,95,236,0.18)]"
            />
          ))}
        </div>
      ) : null}

      {cell.hasMissing ? (
        <span className="absolute right-2 top-1.5 text-[clamp(0.75rem,1vw,1rem)] text-[#6d5fec] drop-shadow-[0_1px_1px_rgba(109,95,236,0.12)]">
          ★
        </span>
      ) : null}

      {cell.mainSoulCount > 0 ? (
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1">
          {Array.from({ length: cell.mainSoulCount }).map((_, index) => (
            <span
              key={`main-${cell.id}-${index}`}
              className="h-2.5 w-2.5 rounded-[2px] bg-[#6d5fec] shadow-[0_1px_2px_rgba(109,95,236,0.18)]"
            />
          ))}
        </div>
      ) : null}

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="px-3 text-center font-display text-[clamp(2rem,4vw,4.5rem)] font-extrabold tracking-tight text-[#6d5fec]">
          {cell.centerDigit}
        </span>
      </div>

      {cell.poCount > 0 ? (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          {Array.from({ length: cell.poCount }).map((_, index) => (
            <span
              key={`po-${cell.id}-${index}`}
              className="h-4 w-4 rounded-full border-2 border-[#f04a3b] bg-transparent"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
