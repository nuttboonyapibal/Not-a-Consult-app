import type { Check, Data, FieldDef, L, StepDef, TableRow, TreeNode } from "./types";

export const str = (data: Data, key: string): string => {
  const v = data[key];
  return typeof v === "string" ? v.trim() : "";
};

export const list = (data: Data, key: string): string[] => {
  const v = data[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
};

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
