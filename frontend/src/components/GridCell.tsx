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
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {Array.from({ length: cell.subSoulCount }).map((_, index) => (
            <span
              key={`sub-${cell.id}-${index}`}
              className="h-0 w-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-[#6d5fec] drop-shadow-[0_1px_1px_rgba(109,95,236,0.18)]"
            />
          ))}
        </div>
      ) : null}

      {cell.hasMissing ? (
        <span className="absolute right-3 top-3 text-[clamp(0.9rem,1.4vw,1.2rem)] text-[#6d5fec] drop-shadow-[0_1px_1px_rgba(109,95,236,0.12)]">
          ★
        </span>
      ) : null}

      {cell.mainSoulCount > 0 ? (
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1.5">
          {Array.from({ length: cell.mainSoulCount }).map((_, index) => (
            <span
              key={`main-${cell.id}-${index}`}
              className="h-3.5 w-3.5 rounded-[2px] bg-[#6d5fec] shadow-[0_1px_2px_rgba(109,95,236,0.18)]"
            />
          ))}
        </div>
      ) : null}

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="px-4 text-center font-display text-[clamp(2.5rem,5vw,5.25rem)] font-extrabold tracking-tight text-[#6d5fec]">
          {cell.centerDigit}
        </span>
      </div>

      {cell.poCount > 0 ? (
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2">
          {Array.from({ length: cell.poCount }).map((_, index) => (
            <span
              key={`po-${cell.id}-${index}`}
              className="h-5 w-5 rounded-full border-[2.5px] border-[#f04a3b] bg-transparent"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
