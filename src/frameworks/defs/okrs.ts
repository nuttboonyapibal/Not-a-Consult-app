import { cellNum, cellStr, containsAny, rows, str, t } from "../helpers";
import type { Check, Data, Lang, StructuredDef, TableRow } from "./types";

const TASK_WORDS = [
  "ทำแคมเปญ",
  "ทำคอนเทนต์",
  "ทำเว็บ",
  "จัดงาน",
  "จัดอบรม",
  "เปิดตัว",
  "สร้าง",
  "launch",
  "create",
  "build",
  "run ",
  "start",
  "implement",
  "set up",
];

export function krProgress(row: TableRow): number | null {
  const baseline = cellNum(row, "baseline");
  const current = cellNum(row, "current");
  const target = cellNum(row, "target");
  if (baseline == null || target == null || target === baseline) return null;
  return ((current ?? baseline) - baseline) / (target - baseline);
}

export const okrs: StructuredDef = {
  key: "okrs",
  view: "okr",
  steps: [
    {
      id: "objective",
      title: t("Objective", "Objective"),
      intro: t(
        "1 Objective เชิงคุณภาพ ที่ทีมอ่านแล้วอยากทำ และบอกว่าไตรมาสนี้จะไปถึงไหน",
        "1 qualitative Objective that energises the team and says where we'll be this quarter.",
      ),
      fields: [
        {
          key: "objective",
          type: "textarea",
          label: t("Objective", "Objective"),
          example: t("ทำให้ลูกค้าออฟฟิศกลับมาสั่งทุกสัปดาห์", "Make office customers come back every week"),
        },
        {
          key: "period",
          type: "text",
          label: t("ช่วงเวลา", "Period"),
          example: t("Q1 2027", "Q1 2027"),
        },
      ],
    },
    {
      id: "krs",
      title: t("Key Results", "Key Results"),
      intro: t(
        "2–4 ผลลัพธ์ที่วัดเป็นตัวเลข ไม่ใช่รายการงาน",
        "2–4 measurable results, not a task list.",
      ),
      fields: [
        {
          key: "keyResults",
          type: "table",
          label: t("Key Results", "Key Results"),
          hint: t(
            "เขียนแบบ \"เพิ่ม X จาก A เป็น B\" แล้วใส่ตัวเลขตั้งต้น ปัจจุบัน และเป้าหมาย",
            "Write it as \"Increase X from A to B\", then fill in baseline, current and target.",
          ),
          columns: [
            { key: "text", label: t("Key Result", "Key Result"), type: "text" },
            { key: "baseline", label: t("ตั้งต้น", "Baseline"), type: "number" },
            { key: "current", label: t("ปัจจุบัน", "Current"), type: "number" },
            { key: "target", label: t("เป้าหมาย", "Target"), type: "number" },
            { key: "owner", label: t("เจ้าของ", "Owner"), type: "text" },
          ],
        },
      ],
    },
    {
      id: "review",
      title: t("การทบทวน", "Review rhythm"),
      fields: [
        {
          key: "reviewRhythm",
          type: "text",
          label: t("ทบทวนเมื่อไร กับใคร", "When and with whom we review"),
          example: t("ทุกวันจันทร์ 15 นาที กับทีมทั้งหมด", "Every Monday, 15 minutes, whole team"),
        },
      ],
    },
  ],
  example: {
    objective: "ทำให้ลูกค้าออฟฟิศกลับมาสั่งทุกสัปดาห์",
    period: "Q1 2027",
    keyResults: [
      { id: "a", text: "เพิ่ม retention 30 วันจาก 25% เป็น 40%", baseline: 25, current: 31, target: 40, owner: "ฝ้าย" },
      { id: "b", text: "เพิ่มบริษัทที่สมัครแพ็กเกจจาก 3 เป็น 10 แห่ง", baseline: 3, current: 5, target: 10, owner: "ต้น" },
      { id: "c", text: "ลดเวลาส่งเฉลี่ยจาก 25 เหลือ 15 นาที", baseline: 25, current: 21, target: 15, owner: "บอส" },
    ],
    reviewRhythm: "ทุกวันจันทร์ 15 นาที กับทีมทั้งหมด",
  },
  checks(data: Data): Check[] {
    const checks: Check[] = [];
    if (!str(data, "objective")) {
      checks.push({ id: "no-objective", level: "error", field: "objective", message: t("ยังไม่มี Objective", "No Objective yet.") });
    }
    const krs = rows(data, "keyResults").filter((r) => cellStr(r, "text"));
    if (krs.length < 2 || krs.length > 4) {
      checks.push({
        id: "kr-count",
        level: "warn",
        field: "keyResults",
        message: {
          th: `มี ${krs.length} KR ควรมี 2–4 ข้อ`,
          en: `${krs.length} KRs. Aim for 2–4.`,
        },
      });
    }
    const noTarget = krs.filter((r) => cellNum(r, "target") == null);
    if (noTarget.length) {
      checks.push({
        id: "kr-no-number",
        level: "error",
        field: "keyResults",
        message: {
          th: `KR ต้องวัดเป็นตัวเลข: "${cellStr(noTarget[0], "text")}" ยังไม่มีเป้าหมาย`,
          en: `KRs must be measurable: "${cellStr(noTarget[0], "text")}" has no target.`,
        },
      });
    }
    const taskLike = krs.filter((r) => {
      const text = cellStr(r, "text").toLowerCase();
      return TASK_WORDS.some((w) => text.startsWith(w)) || (containsAny(text, ["แคมเปญ", "campaign"]) && cellNum(r, "target") == null);
    });
    if (taskLike.length) {
      checks.push({
        id: "kr-task",
        level: "warn",
        field: "keyResults",
        message: {
          th: `"${cellStr(taskLike[0], "text")}" อ่านเหมือนรายการงาน ลองเขียนเป็นผลลัพธ์ที่วัดได้`,
          en: `"${cellStr(taskLike[0], "text")}" reads like a task. Rewrite it as a measurable result.`,
        },
      });
    }
    const noOwner = krs.filter((r) => !cellStr(r, "owner"));
    if (krs.length && noOwner.length) {
      checks.push({
        id: "kr-owner",
        level: "warn",
        field: "keyResults",
        message: t("บาง KR ยังไม่มีเจ้าของ", "Some KRs have no owner."),
      });
    }
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const out: string[] = [];
    if (str(data, "objective")) out.push(`Objective: ${str(data, "objective")}`);
    for (const r of rows(data, "keyResults").filter((x) => cellStr(x, "text")).slice(0, 4)) {
      const p = krProgress(r);
      out.push(`KR: ${cellStr(r, "text")}${p == null ? "" : lang === "th" ? ` (คืบหน้า ${Math.round(p * 100)}%)` : ` (${Math.round(p * 100)}% done)`}`);
    }
    return out;
  },
};
