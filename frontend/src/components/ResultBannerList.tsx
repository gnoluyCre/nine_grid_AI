// input: 结果页提示横幅列表。
// output: 单行倾向的超低高度横幅消息区域。
// pos: 结果页的辅助提示组件。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import type { BannerViewModel } from "../types/models";

interface ResultBannerListProps {
  banners: BannerViewModel[];
}

export function ResultBannerList({ banners }: ResultBannerListProps) {
  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {banners.map((banner) => (
        <div
          key={banner.code}
          className={`rounded-[14px] border px-3 py-1.5 ${
            banner.type === "warning"
              ? "border-[#f0d6d6] bg-[#fff7f7] text-[#7e2f2f]"
              : "border-plum/15 bg-plum/5 text-plum"
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-xs font-semibold leading-4">{banner.title}</p>
            <p className="text-[10px] leading-4 opacity-80">{banner.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
