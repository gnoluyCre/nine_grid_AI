// input: 后端返回的时辰文本与可空展示值。
// output: 统一补齐“时”字后的时辰展示文本，并收口“未知”展示。
// pos: 结果页、详情页与档案列表共享的时辰格式化工具。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md

const SHICHEN_SET = new Set(["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]);
export const UNKNOWN_DISPLAY = "未知";

export function formatUnknownDisplay(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized || UNKNOWN_DISPLAY;
}

export function formatShichenLabel(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  if (!normalized || normalized === UNKNOWN_DISPLAY) {
    return UNKNOWN_DISPLAY;
  }
  if (normalized.endsWith("时")) {
    return normalized;
  }
  return SHICHEN_SET.has(normalized) ? `${normalized}时` : normalized;
}

export function formatHalfSupplementDisplay(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized || UNKNOWN_DISPLAY;
}
