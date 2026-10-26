import { TAG_COLORS, type Check, type Data, type FieldDef, type L, type ListItem, type StepDef, type TableRow, type TagColor, type TreeNode } from "./types";

export const str = (data: Data, key: string): string => {
  const v = data[key];
  return typeof v === "string" ? v.trim() : "";
};

const isTag = (v: unknown): v is TagColor => typeof v === "string" && (TAG_COLORS as readonly string[]).includes(v);

/**
 * Reads a list value as items. Older data stores plain strings; those get ids
 * from their position so they stay stable until the list is next saved.
 */
export function toItems(value: unknown, key = "item"): ListItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((v, i): ListItem[] => {
    if (typeof v === "string") return [{ id: `${key}-${i}`, text: v }];
    if (v && typeof v === "object" && typeof (v as ListItem).text === "string") {
      const item = v as ListItem;
      return [{ id: typeof item.id === "string" ? item.id : `${key}-${i}`, text: item.text, ...(isTag(item.tag) ? { tag: item.tag } : {}) }];
    }
    return [];
  });
}

export const listItems = (data: Data, key: string): ListItem[] => toItems(data[key], key);

/** The non-empty texts of a list field. */
export const list = (data: Data, key: string): string[] =>
  listItems(data, key)
    .map((i) => i.text.trim())
    .filter(Boolean);

export const newItemId = () => Math.random().toString(36).slice(2, 10);

export const newItem = (text: string, tag?: TagColor): ListItem => ({ id: newItemId(), text, ...(tag ? { tag } : {}) });

/**
 * Moves one item to another position, in the same list or another one.
 * Returns the patch to save (one or two keys).
 */
export function moveItem(data: Data, from: { field: string; id: string }, to: { field: string; index: number }): Data {
  const source = listItems(data, from.field);
  const item = source.find((i) => i.id === from.id);
  if (!item) return {};
  const without = source.filter((i) => i.id !== from.id);
  if (from.field === to.field) {
    const fromIndex = source.indexOf(item);
    const index = Math.max(0, Math.min(to.index > fromIndex ? to.index - 1 : to.index, without.length));
    return { [from.field]: [...without.slice(0, index), item, ...without.slice(index)] };
  }
  const target = listItems(data, to.field);
  const index = Math.max(0, Math.min(to.index, target.length));
  return { [from.field]: without, [to.field]: [...target.slice(0, index), item, ...target.slice(index)] };
}

/** Items of a list field that carry the given color. */
export const taggedTexts = (data: Data, key: string, tag: TagColor) =>
  listItems(data, key)
    .filter((i) => i.tag === tag && i.text.trim())
    .map((i) => i.text.trim());

export const num = (data: Data, key: string): number | null => {
  const v = data[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
};

export const rows = (data: Data, key: string): TableRow[] => {
  const v = data[key];
  return Array.isArray(v) ? (v.filter((r) => r && typeof r === "object") as TableRow[]) : [];
};

export const cellNum = (row: TableRow, key: string): number | null => {
  const v = row[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
};

export const cellStr = (row: TableRow, key: string): string => {
  const v = row[key];
  return typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
};

export const tree = (data: Data, key: string): TreeNode | null => {
  const v = data[key];
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const node = v as TreeNode;
  return typeof node.text === "string" && Array.isArray(node.children) ? node : null;
};

export function walkTree(node: TreeNode, fn: (n: TreeNode, depth: number) => void, depth = 0) {
  fn(node, depth);
  for (const child of node.children) walkTree(child, fn, depth + 1);
}

export const isFilled = (value: unknown): boolean => {
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.some(isFilled);
  if (typeof value === "object") {
    const node = value as Partial<TreeNode>;
    if (typeof node.text === "string") return node.text.trim() !== "" || (node.children ?? []).length > 0;
    return Object.entries(value).some(([k, v]) => k !== "id" && isFilled(v));
  }
  return Boolean(value);
};

export const containsAny = (text: string, words: string[]) => {
  const lower = text.toLowerCase();
  return words.some((w) => lower.includes(w));
};

// Every framework ends with the same step, following the cheat sheet's rule:
// use real data, then finish with a decision or a hypothesis to test.
export const SOURCES = "_sources";
export const CONCLUSION = "_conclusion";
export const NEXT = "_next";

const closingFields: FieldDef[] = [
  {
    key: SOURCES,
    type: "list",
    label: { th: "ข้อมูลจริงที่ใช้", en: "Real data used" },
    hint: {
      th: "ตัวเลขจริง การคุยกับลูกค้า หรือเอกสารที่ใช้เติม framework นี้ ไม่ใช่ความเชื่อของทีม",
      en: "Real numbers, customer conversations or documents behind this framework, not the team's beliefs.",
    },
    example: {
      th: "สัมภาษณ์ลูกค้า 8 ราย (ต.ค. 2026), ยอดขายจาก POS ย้อนหลัง 6 เดือน",
      en: "8 customer interviews (Oct 2026), 6 months of POS sales data",
    },
  },
  {
    key: CONCLUSION,
    type: "textarea",
    label: { th: "ข้อสรุป", en: "Conclusion" },
    hint: {
      th: "สิ่งที่ framework นี้บอกเรา เขียนให้คนที่ไม่ได้อยู่ในห้องอ่านแล้วเข้าใจในประโยคเดียว",
      en: "What this framework tells us, in one sentence someone outside the room would understand.",
    },
  },
  {
    key: NEXT,
    type: "textarea",
    label: { th: "การตัดสินใจ หรือสมมติฐานที่จะทดสอบต่อ", en: "Decision, or hypothesis to test next" },
    hint: {
      th: "จบด้วยสิ่งที่จะทำ เช่น \"ทดสอบว่าลูกค้า 30% ยอมจ่ายเพิ่ม 50 บาท ภายใน 2 สัปดาห์\"",
      en: "End with an action, e.g. \"Test whether 30% of customers will pay 50 THB more, within 2 weeks\".",
    },
  },
];

export const closingStep: StepDef = {
  id: "closing",
  title: { th: "ข้อสรุปและสิ่งที่จะทำต่อ", en: "Conclusion and next step" },
  intro: {
    th: "framework ช่วยตั้งคำถาม แต่ไม่ได้ให้คำตอบในตัวเอง กรอกช่องครบไม่ได้แปลว่าคิดเสร็จ",
    en: "A framework helps you ask questions; it doesn't answer them. Filling every box doesn't mean the thinking is done.",
  },
  fields: closingFields,
};

export function closingChecks(data: Data): Check[] {
  const checks: Check[] = [];
  if (list(data, SOURCES).length === 0) {
    checks.push({
      id: "no-sources",
      level: "warn",
      field: SOURCES,
      message: {
        th: "ยังไม่ระบุข้อมูลจริงที่ใช้ คำตอบอาจมาจากความเชื่อของทีม",
        en: "No real data listed yet. The answers may be the team's beliefs.",
      },
    });
  }
  if (!str(data, CONCLUSION)) {
    checks.push({
      id: "no-conclusion",
      level: "warn",
      field: CONCLUSION,
      message: { th: "ยังไม่มีข้อสรุป", en: "No conclusion yet." },
    });
  }
  if (!str(data, NEXT)) {
    checks.push({
      id: "no-next",
      level: "warn",
      field: NEXT,
      message: {
        th: "ยังไม่มีการตัดสินใจหรือสมมติฐานที่จะทดสอบต่อ",
        en: "No decision or hypothesis to test yet.",
      },
    });
  }
  return checks;
}

export const t = (th: string, en: string): L => ({ th, en });
