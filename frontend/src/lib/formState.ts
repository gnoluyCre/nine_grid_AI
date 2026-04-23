// input: sessionStorage 与表单/编辑上下文类型。
// output: 草稿、编辑态和新建意图的读写函数。
// pos: 前端表单持久化工具层。
// 一旦我被更新务必更新我的开头注释以及所属文件夹的 md
import type { BirthFormValue, EditingRecordContext } from "../types/models";

export const DEFAULT_REGION_ID = "陕西省|渭南市|蒲城县";
export const DEFAULT_BIRTH_TIME = "12:00";
export const FORM_DRAFT_STORAGE_KEY = "nine-grid.birth-form-draft";
export const EDITING_RECORD_STORAGE_KEY = "nine-grid.editing-record";
export const NEW_RECORD_INTENT_STORAGE_KEY = "nine-grid.new-record-intent";

export const DEFAULT_FORM_VALUE: BirthFormValue = {
  name: "",
  gender: "",
  birthDate: "",
  birthTime: DEFAULT_BIRTH_TIME,
  regionId: DEFAULT_REGION_ID,
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidBirthTime(value: string) {
  return TIME_PATTERN.test(value);
}

export function isValidBirthDate(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const lastDay = new Date(year, month, 0).getDate();
  return month >= 1 && month <= 12 && day >= 1 && day <= lastDay;
}

export function normalizeBirthFormValue(value: Partial<BirthFormValue> | null | undefined): BirthFormValue {
  return {
    name: value?.name?.trim() ?? "",
    gender: value?.gender?.trim() ?? "",
    birthDate: isValidBirthDate(value?.birthDate ?? "") ? value!.birthDate!.trim() : "",
    birthTime: isValidBirthTime(value?.birthTime ?? "") ? value!.birthTime!.trim() : DEFAULT_BIRTH_TIME,
    regionId: value?.regionId?.trim() || DEFAULT_REGION_ID,
  };
}

export function loadBirthFormDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(FORM_DRAFT_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }
    return normalizeBirthFormValue(JSON.parse(rawValue) as Partial<BirthFormValue>);
  } catch {
    return null;
  }
}

export function saveBirthFormDraft(value: BirthFormValue) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(FORM_DRAFT_STORAGE_KEY, JSON.stringify(value));
}

export function clearBirthFormDraft() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(FORM_DRAFT_STORAGE_KEY);
}

export function loadEditingRecordContext() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(EDITING_RECORD_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }
    const parsedValue = JSON.parse(rawValue) as EditingRecordContext;
    if (!parsedValue?.recordId) {
      return null;
    }
    return {
      recordId: parsedValue.recordId,
      formValue: normalizeBirthFormValue(parsedValue.formValue),
    };
  } catch {
    return null;
  }
}

export function saveEditingRecordContext(context: EditingRecordContext) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(EDITING_RECORD_STORAGE_KEY, JSON.stringify(context));
}

export function clearEditingRecordContext() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(EDITING_RECORD_STORAGE_KEY);
}

export function saveNewRecordIntent() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(NEW_RECORD_INTENT_STORAGE_KEY, "1");
}

export function consumeNewRecordIntent() {
  if (typeof window === "undefined") {
    return false;
  }

  const exists = window.sessionStorage.getItem(NEW_RECORD_INTENT_STORAGE_KEY) === "1";
  if (exists) {
    window.sessionStorage.removeItem(NEW_RECORD_INTENT_STORAGE_KEY);
  }
  return exists;
}

export function formatDateParts(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatTimeParts(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseDateParts(value: string) {
  if (!isValidBirthDate(value)) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split("-");
  return {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
  };
}

export function parseTimeParts(value: string) {
  if (!isValidBirthTime(value)) {
    return null;
  }

  const [hourText, minuteText] = value.split(":");
  return {
    hour: Number(hourText),
    minute: Number(minuteText),
  };
}
