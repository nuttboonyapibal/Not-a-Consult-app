import { list, str, t } from "../helpers";
import { emptyWarnings, items, listField, listSummary, textField } from "./fields";
import type { Check, Data, Lang, StructuredDef } from "./types";

const strategy = textField("strategy", t("กลยุทธ์ที่ scorecard นี้วัด", "The strategy this scorecard measures"));
const VIEWS = [
  listField("financial", t("การเงิน", "Financial"), t("ผลลัพธ์ทางการเงินที่ต้องเห็น พร้อมตัวเลข", "Financial results to see, with numbers.")),
  listField("customer", t("ลูกค้า", "Customer"), t("ลูกค้าต้องเห็นเราอย่างไร วัดอย่างไร", "How customers must see us, and how we measure it.")),
  listField("internal", t("กระบวนการภายใน", "Internal process"), t("กระบวนการที่ต้องทำได้ดีเยี่ยม", "Processes we must excel at.")),
  listField("learning", t("การเรียนรู้และการเติบโต", "Learning & growth"), t("คน ทักษะ และระบบที่ต้องพัฒนา", "People, skills and systems to develop.")),
];

const MAX_PER_VIEW = 4;

export const balancedScorecard: StructuredDef = {
  key: "balanced-scorecard",
  view: "canvas",
  steps: [
    { id: "strategy", title: t("กลยุทธ์", "Strategy"), fields: [strategy] },
    {
      id: "views",
      title: t("4 มุมมอง", "4 perspectives"),
      intro: t("มุมมองละไม่เกิน 4 ตัวชี้วัด ที่มีคนติดตามจริง", "At most 4 metrics per perspective that someone really tracks."),
      fields: VIEWS,
    },
  ],
  canvas: {
    boards: [
      { columns: 1, areas: ["strategy"], cells: [{ area: "strategy", fields: ["strategy"], tone: "accent" }] },
      {
        columns: 2,
        areas: ["financial customer", "internal learning"],
        cells: VIEWS.map((f) => ({ area: f.key, fields: [f.key] })),
      },
    ],
  },
  example: {
    strategy: "โตด้วยลูกค้าองค์กรที่กลับมาสั่งทุกสัปดาห์",
    financial: items("รายได้แพ็กเกจองค์กร 300,000 บาท/เดือน"),
    customer: items("retention 30 วัน 40%"),
    internal: items("ส่งตรงเวลา 95%"),
    learning: items("เซลส์องค์กรผ่านการอบรม B2B 2 คน"),
  },
  checks(data: Data): Check[] {
    const checks = emptyWarnings(data, VIEWS);
    if (!str(data, "strategy")) checks.push({ id: "no-strategy", level: "warn", field: "strategy", message: t("ยังไม่ได้ระบุกลยุทธ์", "No strategy stated.") });
    const crowded = VIEWS.find((f) => list(data, f.key).length > MAX_PER_VIEW);
    if (crowded) {
      checks.push({
        id: "too-many-metrics",
        level: "warn",
        field: crowded.key,
        message: {
          th: `"${crowded.label.th}" มีตัวชี้วัดเกิน ${MAX_PER_VIEW} ตัว เสี่ยงที่ไม่มีใครติดตามจริง (กับดักที่พบบ่อย)`,
          en: `"${crowded.label.en}" has more than ${MAX_PER_VIEW} metrics; nobody may really track them (common trap).`,
        },
      });
    }
    return checks;
  },
  summarize: (data: Data, lang: Lang) => listSummary(data, VIEWS, lang, 1),
};
