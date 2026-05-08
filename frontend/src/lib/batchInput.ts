// input: 用户手动粘贴的多人排盘文本与出生表单类型。
// output: 批量文本解析、日期/时间宽松格式归一化与错误提示。
// pos: 前端批量排盘输入解析工具层。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import type { BirthFormValue } from "../types/models";
import { formatDateParts, formatTimeParts, isValidBirthDate } from "./formState";

export interface BatchBirthInputItem {
  index: number;
  formValue: BirthFormValue;
}

export interface BatchBirthInputParseResult {
  items: BatchBirthInputItem[];
  errors: string[];
}

const FIELD_SPLIT_PATTERN = /[:：]/;
const DATE_LABEL_PATTERN = /^(生日|出生日期|公历生日|日期|birth\s*date)$/i;
const TIME_LABEL_PATTERN = /^(时间|出生时间|时辰|出生时辰|birth\s*time|time).*$/i;
const NAME_LABEL_PATTERN = /^(档案名|姓名|名字|名称|name).*$/i;
const HAN_DIGIT_MAP: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

export function parseBatchBirthInput(rawText: string): BatchBirthInputParseResult {
  const blocks = rawText
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
  const items: BatchBirthInputItem[] = [];
  const errors: string[] = [];

  blocks.forEach((block, blockIndex) => {
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const fields = parseBlockFields(lines);
    const birthDate = parseFlexibleDate(fields.birthDate);
    const birthTime = fields.birthTime ? parseFlexibleTime(fields.birthTime) : "";

    if (!birthDate) {
      errors.push(`第 ${blockIndex + 1} 位缺少有效生日`);
      return;
    }
    if (fields.birthTime && !birthTime) {
      errors.push(`第 ${blockIndex + 1} 位时间格式无法识别`);
      return;
    }

    items.push({
      index: blockIndex + 1,
      formValue: {
        name: fields.name || `批量档案${blockIndex + 1}`,
        gender: "未知",
        birthDate,
        birthTime,
        regionId: "",
      },
    });
  });

  if (rawText.trim() && blocks.length === 0) {
    errors.push("请按每位用户一组填写，多个用户之间使用空行隔开。");
  }

  return { items, errors };
}

function parseBlockFields(lines: string[]) {
  const fields = {
    name: "",
    birthDate: "",
    birthTime: "",
  };
  const positional: string[] = [];

  lines.forEach((line) => {
    const [rawKey, ...rest] = line.split(FIELD_SPLIT_PATTERN);
    const value = rest.join(":").trim();
    const key = rawKey.trim().replace(/\s|\(.*?\)|（.*?）/g, "");

    if (NAME_LABEL_PATTERN.test(key)) {
      fields.name = value;
      return;
    }
    if (DATE_LABEL_PATTERN.test(key)) {
      fields.birthDate = value;
      return;
    }
    if (TIME_LABEL_PATTERN.test(key)) {
      fields.birthTime = value;
      return;
    }
    positional.push(line);
  });

  positional.forEach((value) => {
    if (!fields.birthDate && parseFlexibleDate(value)) {
      fields.birthDate = value;
      return;
    }
    if (!fields.birthTime && parseFlexibleTime(value)) {
      fields.birthTime = value;
      return;
    }
    if (!fields.name) {
      fields.name = value;
    }
  });

  return fields;
}

export function parseFlexibleDate(value: string) {
  const text = value.trim();
  if (!text) {
    return "";
  }

  const compactMatch = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    return normalizeDateNumbers(Number(compactMatch[1]), Number(compactMatch[2]), Number(compactMatch[3]));
  }

  const numericMatch = text.match(/^(\d{4})[.\-/年](\d{1,2})[.\-/月](\d{1,2})日?$/);
  if (numericMatch) {
    return normalizeDateNumbers(Number(numericMatch[1]), Number(numericMatch[2]), Number(numericMatch[3]));
  }

  const hanMatch = text.match(/^([零〇一二两三四五六七八九]{4})年([零〇一二两三四五六七八九十]{1,3})月([零〇一二两三四五六七八九十]{1,3})日?$/);
  if (hanMatch) {
    return normalizeDateNumbers(parseHanYear(hanMatch[1]), parseHanNumber(hanMatch[2]), parseHanNumber(hanMatch[3]));
  }

  return "";
}

export function parseFlexibleTime(value: string) {
  const rawText = value.trim();
  if (!rawText) {
    return "";
  }

  const isAfternoon = /下午|晚上|傍晚|pm/i.test(rawText);
  const isMorning = /上午|早上|凌晨|am/i.test(rawText);
  const text = rawText.replace(/上午|早上|凌晨|下午|晚上|傍晚|am|pm/gi, "").trim();
  const colonMatch = text.match(/^(\d{1,2})[:：](\d{1,2})$/);
  const hanMatch = text.match(/^(\d{1,2})[点时](?:(\d{1,2})分?)?$/);
  const compactMatch = text.match(/^(\d{1,2})(\d{2})$/);
  const hourOnlyMatch = text.match(/^(\d{1,2})$/);
  const matched = colonMatch ?? hanMatch ?? compactMatch ?? hourOnlyMatch;

  if (!matched) {
    return "";
  }

  let hour = Number(matched[1]);
  const minute = Number(matched[2] ?? 0);
  if (isAfternoon && hour < 12) {
    hour += 12;
  }
  if (isMorning && hour === 12) {
    hour = 0;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return "";
  }

  return formatTimeParts(hour, minute);
}

function normalizeDateNumbers(year: number, month: number, day: number) {
  const normalized = formatDateParts(year, month, day);
  return isValidBirthDate(normalized) ? normalized : "";
}

function parseHanYear(value: string) {
  return Number(
    Array.from(value)
      .map((char) => HAN_DIGIT_MAP[char])
      .join(""),
  );
}

function parseHanNumber(value: string) {
  if (value === "十") {
    return 10;
  }
  if (value.startsWith("十")) {
    return 10 + (HAN_DIGIT_MAP[value[1]] ?? 0);
  }
  if (value.endsWith("十")) {
    return (HAN_DIGIT_MAP[value[0]] ?? 0) * 10;
  }
  if (value.includes("十")) {
    const [tens, ones] = value.split("十");
    return (HAN_DIGIT_MAP[tens] ?? 0) * 10 + (HAN_DIGIT_MAP[ones] ?? 0);
  }
  return Number(
    Array.from(value)
      .map((char) => HAN_DIGIT_MAP[char])
      .join(""),
  );
}
