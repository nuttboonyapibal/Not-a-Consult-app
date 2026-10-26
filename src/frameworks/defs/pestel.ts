import { list, str, t } from "../helpers";
import { items, listField, textField } from "./fields";
import type { Check, Data, Lang, StructuredDef } from "./types";

const AREAS = [
  listField("political", t("การเมือง (P)", "Political"), t("นโยบายรัฐ การส่งเสริม การควบคุม", "Government policy, support, control.")),
  listField("economic", t("เศรษฐกิจ (E)", "Economic"), t("ค่าครองชีพ ต้นทุน กำลังซื้อ ดอกเบี้ย", "Cost of living, costs, spending power, rates.")),
  listField("social", t("สังคม (S)", "Social"), t("พฤติกรรม ค่านิยม ประชากร", "Behaviour, values, demographics.")),
  listField("technological", t("เทคโนโลยี (T)", "Technological"), t("เทคโนโลยีที่เปลี่ยนวิธีขายหรือทำงาน", "Technology changing how we sell or work.")),
  listField("environmental", t("สิ่งแวดล้อม (E)", "Environmental"), t("กฎหรือความคาดหวังด้านสิ่งแวดล้อม", "Environmental rules or expectations.")),
  listField("legal", t("กฎหมาย (L)", "Legal"), t("กฎหมายและข้อบังคับที่เกี่ยวข้อง", "Relevant laws and regulations.")),
];

const priority = listField(
  "priority",
  t("2–3 ปัจจัยที่กระทบจริง", "The 2–3 factors that really matter"),
  t("เลือกจากด้านบนเฉพาะที่กระทบธุรกิจมากที่สุด", "Pick only those above that affect the business most."),
);
const impact = textField("impact", t("กระทบอย่างไร และจะทำอะไร", "Impact, and what we'll do"));

export const pestel: StructuredDef = {
  key: "pestel",
  view: "canvas",
  steps: [
    { id: "scan", title: t("ไล่ 6 ด้าน", "Scan the 6 areas"), fields: AREAS },
    {
      id: "priority",
      title: t("เลือกที่กระทบจริง", "Prioritize"),
      intro: t("ลิสต์ทุกอย่างโดยไม่จัดลำดับคือกับดักที่พบบ่อย", "Listing everything without priorities is the common trap."),
      fields: [priority, impact],
    },
  ],
  canvas: {
    boards: [
      {
        columns: 3,
        areas: ["political economic social", "technological environmental legal"],
        cells: AREAS.map((f) => ({ area: f.key, fields: [f.key] })),
      },
      {
        columns: 2,
        areas: ["priority impact"],
        cells: [
          { area: "priority", fields: ["priority"], tone: "accent" },
          { area: "impact", fields: ["impact"] },
        ],
      },
    ],
  },
  example: {
    political: items("นโยบายส่งเสริมสวัสดิการพนักงาน"),
    economic: items("ค่าวัตถุดิบเพิ่ม 8%", "บริษัทลดงบสวัสดิการ"),
    social: items("คนใส่ใจสุขภาพมากขึ้น", "ทำงานแบบ hybrid"),
    technological: items("สั่งผ่าน LINE ได้ง่าย"),
    environmental: items("กฎลดพลาสติกใช้ครั้งเดียว"),
    legal: items("ภาษีความหวาน"),
    priority: items("ค่าวัตถุดิบเพิ่ม 8%", "ทำงานแบบ hybrid"),
    impact: "ปรับราคาแพ็กเกจปีหน้า 5% และเสนอแพ็กเกจเฉพาะวันที่เข้าออฟฟิศ",
  },
  checks(data: Data): Check[] {
    const checks: Check[] = [];
    const total = AREAS.reduce((n, f) => n + list(data, f.key).length, 0);
    const picked = list(data, "priority").length;
    if (total > 0 && picked === 0) {
      checks.push({
        id: "no-priority",
        level: "warn",
        field: "priority",
        message: t(
          "ยังไม่ได้เลือก 2–3 ปัจจัยที่กระทบจริง (กับดักที่พบบ่อย: ลิสต์ทุกอย่างจนไม่มีลำดับความสำคัญ)",
          "No priority factors chosen (common trap: listing everything with no priorities).",
        ),
      });
    } else if (picked > 3) {
      checks.push({
        id: "too-many-priorities",
        level: "warn",
        field: "priority",
        message: t("เลือกเกิน 3 ปัจจัย ลองตัดให้เหลือที่กระทบที่สุด", "More than 3 picked. Cut to the ones that matter most."),
      });
    }
    if (picked > 0 && !str(data, "impact")) {
      checks.push({ id: "no-impact", level: "warn", field: "impact", message: t("ยังไม่ได้บอกว่าจะทำอะไร", "No response planned yet.") });
    }
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const out: string[] = [];
    if (list(data, "priority").length) out.push(`${lang === "th" ? "ปัจจัยสำคัญ" : "Key factors"}: ${list(data, "priority").join(", ")}`);
    if (str(data, "impact")) out.push(str(data, "impact"));
    return out;
  },
};
