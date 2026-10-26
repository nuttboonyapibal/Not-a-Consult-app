import { list, t } from "../helpers";
import { emptyWarnings, items, listField, listSummary } from "./fields";
import type { Check, Data, Lang, StructuredDef } from "./types";

const HARD = [
  listField("strategy", t("Strategy", "Strategy"), t("กลยุทธ์ใหม่ที่องค์กรต้องรองรับ", "The new strategy the organization must support.")),
  listField("structure", t("Structure", "Structure"), t("ผังองค์กร ใครรายงานใคร", "Org chart, reporting lines.")),
  listField("systems", t("Systems", "Systems"), t("ระบบและกระบวนการทำงานประจำวัน", "Day-to-day systems and processes.")),
];
const SOFT = [
  listField("sharedValues", t("Shared values", "Shared values"), t("สิ่งที่ทุกคนเชื่อร่วมกัน", "What everyone believes in.")),
  listField("style", t("Style", "Style"), t("สไตล์การนำและการตัดสินใจ", "Leadership and decision-making style.")),
  listField("staff", t("Staff", "Staff"), t("คนที่มี จำนวนและบทบาท", "The people: numbers and roles.")),
  listField("skills", t("Skills", "Skills"), t("ความสามารถที่องค์กรมีและยังขาด", "Capabilities the organization has and lacks.")),
];
const gaps = listField(
  "gaps",
  t("จุดที่ยังไม่สอดคล้องกับกลยุทธ์", "Gaps against the strategy"),
  t("องค์ประกอบไหนยังไม่รองรับกลยุทธ์ใหม่ และต้องเปลี่ยนอะไร", "Which elements don't support the strategy yet, and what must change."),
);

export const mckinsey7s: StructuredDef = {
  key: "mckinsey-7s",
  view: "canvas",
  steps: [
    { id: "hard", title: t("Hard elements", "Hard elements"), fields: HARD },
    { id: "soft", title: t("Soft elements", "Soft elements"), intro: t("ส่วนที่เปลี่ยนยากกว่าแต่สำคัญพอกัน", "Harder to change, just as important."), fields: SOFT },
    { id: "gaps", title: t("ความไม่สอดคล้อง", "Gaps"), fields: [gaps] },
  ],
  canvas: {
    boards: [
      {
        columns: 3,
        areas: ["strategy structure systems", "style sharedValues staff", "skills gaps gaps"],
        cells: [
          { area: "strategy", fields: ["strategy"] },
          { area: "structure", fields: ["structure"] },
          { area: "systems", fields: ["systems"] },
          { area: "style", fields: ["style"] },
          { area: "sharedValues", fields: ["sharedValues"], tone: "accent" },
          { area: "staff", fields: ["staff"] },
          { area: "skills", fields: ["skills"] },
          { area: "gaps", fields: ["gaps"], tone: "warn" },
        ],
      },
    ],
  },
  example: {
    strategy: items("โฟกัสลูกค้าองค์กร"),
    structure: items("เพิ่มทีมขายองค์กร 2 คน"),
    systems: items("ยังรับออเดอร์ผ่าน LINE ด้วยมือ"),
    sharedValues: items("อาหารดีต่อสุขภาพ ส่งตรงเวลา"),
    style: items("เจ้าของตัดสินใจทุกเรื่อง"),
    staff: items("ครัว 6 คน", "ไรเดอร์ 4 คน"),
    skills: items("ทำอาหารเก่ง", "ยังไม่มีทักษะขาย B2B"),
    gaps: items("ระบบรับออเดอร์ยังออกใบแจ้งหนี้บริษัทไม่ได้", "ยังไม่มีคนขาย B2B"),
  },
  checks(data: Data): Check[] {
    const checks = emptyWarnings(data, [HARD[0]]);
    if (list(data, "structure").length > 0 && (list(data, "systems").length === 0 || list(data, "sharedValues").length === 0)) {
      checks.push({
        id: "structure-only",
        level: "warn",
        field: list(data, "systems").length === 0 ? "systems" : "sharedValues",
        message: t(
          "เปลี่ยนโครงสร้างแล้ว แต่ยังไม่ได้ดูระบบหรือค่านิยม (กับดักที่พบบ่อย)",
          "Structure is changing but systems or shared values aren't addressed (common trap).",
        ),
      });
    }
    if (list(data, "gaps").length === 0) {
      checks.push({ id: "no-gaps", level: "warn", field: "gaps", message: t("ยังไม่ได้ระบุจุดที่ไม่สอดคล้อง", "No gaps identified yet.") });
    }
    return checks;
  },
  summarize: (data: Data, lang: Lang) => listSummary(data, [HARD[0], gaps], lang),
};
