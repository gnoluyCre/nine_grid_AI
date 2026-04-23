// input: 结果页提示横幅列表。
// output: 横幅消息区域。
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
    <div className="space-y-3">
      {banners.map((banner) => (
        <div
          key={banner.code}
          className={`rounded-3xl border px-5 py-4 ${
            banner.type === "warning"
              ? "border-[#f0d6d6] bg-[#fff7f7] text-[#7e2f2f]"
              : "border-plum/15 bg-plum/5 text-plum"
          }`}
        >
          <p className="text-sm font-semibold">{banner.title}</p>
          <p className="mt-1 text-sm leading-6 opacity-80">{banner.description}</p>
        </div>
      ))}
    </div>
  );
}
