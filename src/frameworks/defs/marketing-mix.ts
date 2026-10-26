import { list, str, t } from "../helpers";
import { emptyWarnings, items, listField, listSummary, selectField, textField } from "./fields";
import type { Check, Data, Lang, StructuredDef } from "./types";

const businessType = selectField("businessType", t("ประเภทธุรกิจ", "Business type"), [
  { value: "product", label: t("ขายสินค้า (4P)", "Product (4P)") },
  { value: "service", label: t("บริการ (7P)", "Service (7P)") },
]);
const positioning = textField(
  "positioning",
  t("Positioning", "Positioning"),
  t("ยืนตรงไหนในใจลูกค้า ทุก P ต้องสอดคล้องกับประโยคนี้", "Where we stand in customers' minds. Every P must fit this."),
  t("มื้อเที่ยงสุขภาพที่ตรงเวลาที่สุดสำหรับออฟฟิศ CBD", "The most punctual healthy lunch for CBD offices"),
);

const FOUR = [
  listField("product", t("Product", "Product"), undefined, undefined, { profileKey: "offering" }),
  listField("price", t("Price", "Price")),
  listField("place", t("Place", "Place")),
  listField("promotion", t("Promotion", "Promotion")),
];
const SERVICE = [
  listField("people", t("People", "People"), t("คนที่ลูกค้าเจอ", "The people customers meet.")),
  listField("process", t("Process", "Process"), t("ขั้นตอนการให้บริการ", "How the service is delivered.")),
  listField("physicalEvidence", t("Physical evidence", "Physical evidence"), t("สิ่งที่ลูกค้าเห็นหรือจับต้องได้", "What customers see or touch.")),
];

export const marketingMix: StructuredDef = {
  key: "marketing-mix",
  view: "canvas",
  steps: [
    { id: "position", title: t("Positioning", "Positioning"), fields: [businessType, positioning] },
    { id: "four", title: t("4P", "4P"), intro: t("ตัดสินใจทุก P ให้รับกับ positioning เดียวกัน", "Decide every P against the same positioning."), fields: FOUR },
    { id: "service", title: t("3P สำหรับธุรกิจบริการ", "3 more Ps for services"), fields: SERVICE },
  ],
  canvas: {
    boards: [
      {
        columns: 3,
        areas: ["businessType positioning positioning"],
        cells: [
          { area: "businessType", fields: ["businessType"] },
          { area: "positioning", fields: ["positioning"], tone: "accent" },
        ],
      },
      {
        columns: 4,
        areas: ["product price place promotion"],
        cells: FOUR.map((f) => ({ area: f.key, fields: [f.key] })),
      },
      {
        title: t("7P สำหรับธุรกิจบริการ", "7P for service businesses"),
        columns: 3,
        areas: ["people process physicalEvidence"],
        cells: SERVICE.map((f) => ({ area: f.key, fields: [f.key] })),
      },
    ],
  },
  example: {
    businessType: "service",
    positioning: "มื้อเที่ยงสุขภาพที่ตรงเวลาที่สุดสำหรับออฟฟิศ CBD",
    product: items("ข้าวกล่องสุขภาพ 4 เมนูต่อวัน"),
    price: items("120 บาทต่อมื้อ", "แพ็กเกจองค์กรลด 10%"),
    place: items("ส่งถึงโต๊ะ", "สั่งผ่าน LINE และ HR"),
    promotion: items("ทดลองฟรี 1 สัปดาห์สำหรับบริษัท"),
    people: items("ไรเดอร์ประจำตึก"),
    process: items("ตัดรอบสั่ง 10:00 ส่ง 11:45"),
    physicalEvidence: items("กล่องรักษ์โลกพร้อมฉลากแคลอรี่"),
  },
  checks(data: Data): Check[] {
    const checks = emptyWarnings(data, FOUR);
    if (!str(data, "positioning")) {
      checks.push({
        id: "no-positioning",
        level: "warn",
        field: "positioning",
        message: t(
          "ยังไม่มี positioning ทำให้ตัดสินใจแต่ละ P แยกกันจนขัดกันเอง (กับดักที่พบบ่อย)",
          "No positioning, so each P gets decided alone and they clash (common trap).",
        ),
      });
    }
    if (str(data, "businessType") === "service") {
      const missing = SERVICE.filter((f) => list(data, f.key).length === 0);
      if (missing.length) {
        checks.push({
          id: "service-ps",
          level: "warn",
          field: missing[0].key,
          message: {
            th: `ธุรกิจบริการควรกรอก: ${missing.map((f) => f.label.th).join(", ")}`,
            en: `A service business should fill: ${missing.map((f) => f.label.en).join(", ")}`,
          },
        });
      }
    } else if (!str(data, "businessType")) {
      checks.push({ id: "no-type", level: "warn", field: "businessType", message: t("ยังไม่ได้เลือกประเภทธุรกิจ", "Business type not chosen.") });
    }
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const out = str(data, "positioning") ? [`Positioning: ${str(data, "positioning")}`] : [];
    return [...out, ...listSummary(data, FOUR, lang, 1)];
  },
};
