// input: 当前九宫格串与主魂数字。
// output: 图腾、天赋与特质的前端派生结果。
// pos: 灵魂结构扩展信息的本地映射与计算模块。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md

interface NumerologyProfile {
  totem: string;
  talent: string;
  traits: string;
}

export interface SoulProfileViewModel {
  totem: string;
  talentsText: string;
  traitsText: string;
}

const NUMEROLOGY_PROFILE_MAP: Record<string, NumerologyProfile> = {
  "0": {
    totem: "道、灵",
    talent: "转化、先天认知能力、方向感",
    traits:
      "自我学习能力、对事物理解精准、归纳总结能力强、判断力和直觉力强、隐忍、灵巧滋润、滋养预见、顺应、穿越、转换",
  },
  "1": {
    totem: "玉皇大帝",
    talent: "金刚手——疗愈者（阴阳格都带1是天生的左右金刚手）",
    traits: "自信独立、勇敢阳刚、有创造性和号召力（领导力）、果断进取、独特乐观、可信任、有创意",
  },
  "2": {
    totem: "服务官",
    talent: "同理心、感受物质震动",
    traits: "二把手、艺术感、耐心宽容、善于分析、细节控、直觉力强、美感和协调力出色、安静平和、善解人意、优雅、文字语言组织能力好",
  },
  "3": {
    totem: "大心神",
    talent: "心想事成、远程疗愈（阴阳格都带3有读心术能力）",
    traits: "聪明热情、想象力丰富、有创意和幽默感、充满活力、多才多艺、受欢迎、善于表达和社交、乐观有激情、慈悲宽恕、善解人意、悟性高",
  },
  "4": {
    totem: "独裁者",
    talent: "落地和行动能力强",
    traits: "效率高、雷厉风行、独断专权、有组织力、实干家、可靠实干、稳重诚恳且有勇气、任劳任怨、未雨绸缪、做事认真、坚定且忠实、逻辑分明",
  },
  "5": {
    totem: "中正官",
    talent: "上通下达",
    traits: "决断、沟通和执行力强、敢于冒险、博学多才、反传统敢于颠覆、适应环境、坚持自我、智慧、充满活力、有探索心、独创性强、视野宽广、幽默感",
  },
  "6": {
    totem: "法官",
    talent: "千里耳、松果体成像；耳朵通松果体后开启千里耳功能（配合9膀胱可以启动：松果体翻译功能；地球是666，需要肾气作为油箱）",
    traits: "执行、显化、精力旺盛、耐久力强、可信，忠实，爱和平、有同情心，助人为乐、亲和体贴、治疗他人，公正、奉献精神、荣誉感强、有担当和直觉力、有美感鉴赏能力",
  },
  "7": {
    totem: "牛魔王（电性）",
    talent: "仓廪之官、地表的财神财库、度量大、承载",
    traits: "目标性强、地表财神、能守住财、财运好、严格按照自己标准做事、度量大、靠谱踏实且有计划有标准、物质承载力强",
  },
  "8": {
    totem: "统帅",
    talent: "人材、统帅、管理、显化运化",
    traits: "有统筹规划管理和资源整合能力、喜欢指挥、爱分析、善于协调人际关系、有领导力、果断、有洞察力、勇敢、专注有魄力、能屈能伸、智谋出色、有商业头脑和创造财富的雄心",
  },
  "9": {
    totem: "天使（获取信息能力强，自愈力强，性格单纯，化繁为简）",
    talent: "天才、通松果体、下载信息",
    traits: "单纯、服务他人、自愈能力强、下载信息",
  },
};

export function buildSoulProfile(mainSoul: string, digitString: string): SoulProfileViewModel {
  const mainDigit = resolveMainDigit(mainSoul);
  const mainProfile = mainDigit ? NUMEROLOGY_PROFILE_MAP[mainDigit] : null;
  const dedupedDigits = [...new Set([...digitString].filter((digit) => digit in NUMEROLOGY_PROFILE_MAP))];
  const talentsText =
    dedupedDigits.length > 0
      ? dedupedDigits.map((digit) => `${digit}：${NUMEROLOGY_PROFILE_MAP[digit].talent}`).join("；")
      : "—";

  return {
    totem: mainProfile?.totem ?? "—",
    talentsText,
    traitsText: mainProfile?.traits ?? "—",
  };
}

function resolveMainDigit(mainSoul: string) {
  const digits = [...mainSoul].filter((digit) => digit in NUMEROLOGY_PROFILE_MAP);
  return digits.length > 0 ? digits[digits.length - 1] : "";
}
