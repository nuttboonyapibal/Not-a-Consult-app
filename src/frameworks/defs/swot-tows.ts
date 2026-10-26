import { list, t } from "../helpers";
import { emptyWarnings, items, listField, listSummary } from "./fields";
import type { Check, Data, Lang, StructuredDef } from "./types";

const SWOT = [
  listField("strengths", t("จุดแข็ง (S)", "Strengths"), t("สิ่งที่เราทำได้ดีกว่าคู่แข่ง มีหลักฐาน", "What we do better than rivals, with evidence.")),
  listField("weaknesses", t("จุดอ่อน (W)", "Weaknesses"), t("สิ่งที่ฉุดเราไว้ พูดตรงๆ", "What holds us back. Be honest.")),
  listField("opportunities", t("โอกาส (O)", "Opportunities"), t("สิ่งภายนอกที่เปิดทางให้เรา", "Outside changes that open doors.")),
  listField("threats", t("อุปสรรค (T)", "Threats"), t("สิ่งภายนอกที่อาจทำร้ายเรา", "Outside changes that could hurt us.")),
];

const TOWS = [
  listField("so", t("S-O รุก: ใช้จุดแข็งคว้าโอกาส", "S-O attack: use strengths to seize opportunities")),
  listField("wo", t("W-O ปรับปรุง: แก้จุดอ่อนเพื่อคว้าโอกาส", "W-O improve: fix weaknesses to seize opportunities")),
  listField("st", t("S-T ป้องกัน: ใช้จุดแข็งรับมืออุปสรรค", "S-T defend: use strengths against threats")),
  listField("wt", t("W-T ถอยหรือลดความเสี่ยง", "W-T retreat or reduce risk")),
];

export const swotTows: StructuredDef = {
  key: "swot-tows",
  view: "canvas",
  steps: [
    { id: "swot", title: t("SWOT", "SWOT"), intro: t("รายการสั้นๆ ที่มีหลักฐาน เลือกเฉพาะที่สำคัญ", "Short items with evidence. Keep only what matters."), fields: SWOT },
    {
      id: "tows",
      title: t("TOWS: แปลงเป็นกลยุทธ์", "TOWS: turn it into strategy"),
      intro: t("จับคู่แต่ละช่องของ SWOT ให้เป็นการกระทำ ไม่หยุดแค่รายการ", "Pair the SWOT boxes into actions. Don't stop at the list."),
      fields: TOWS,
    },
  ],
  canvas: {
    boards: [
      {
        title: t("SWOT", "SWOT"),
        columns: 2,
        areas: ["s w", "o t"],
        cells: [
          { area: "s", fields: ["strengths"], tone: "ok" },
          { area: "w", fields: ["weaknesses"], tone: "err" },
          { area: "o", fields: ["opportunities"], tone: "accent" },
          { area: "t", fields: ["threats"], tone: "warn" },
        ],
      },
      {
        title: t("TOWS: แปลงเป็นกลยุทธ์", "TOWS: strategies"),
        columns: 2,
        areas: ["so wo", "st wt"],
        cells: [
          { area: "so", fields: ["so"] },
          { area: "wo", fields: ["wo"] },
          { area: "st", fields: ["st"] },
          { area: "wt", fields: ["wt"] },
        ],
      },
    ],
  },
  example: {
    strengths: items("ครัวกลางใกล้ลูกค้า", "ความสัมพันธ์กับ HR 3 บริษัท"),
    weaknesses: items("ทีมขายมีคนเดียว", "เมนูยังน้อย"),
    opportunities: items("บริษัทเพิ่มสวัสดิการสุขภาพ", "คนกลับมาทำงานที่ออฟฟิศมากขึ้น"),
    threats: items("delivery app ลดราคาแรง", "ค่าวัตถุดิบขึ้น"),
    so: items("ขายแพ็กเกจสวัสดิการให้ HR ย่านเดียวกัน"),
    wo: items("จ้างเซลส์องค์กรเพิ่ม 1 คน"),
    st: items("แข่งด้วยความเร็วและรอบส่งตายตัวแทนการลดราคา"),
    wt: items("ทำสัญญาวัตถุดิบล่วงหน้า 6 เดือน"),
  },
  checks(data: Data): Check[] {
    const checks = emptyWarnings(data, SWOT, "empty-swot");
    const swotFilled = SWOT.some((f) => list(data, f.key).length > 0);
    if (swotFilled && TOWS.every((f) => list(data, f.key).length === 0)) {
      checks.push({
        id: "stopped-at-swot",
        level: "error",
        field: "so",
        message: t(
          "หยุดแค่ SWOT ซึ่งเป็นเพียงรายการ (กับดักที่พบบ่อย) จับคู่เป็นกลยุทธ์ใน TOWS",
          "Stopped at SWOT, which is only a list (common trap). Pair it into TOWS strategies.",
        ),
      });
    }
    const crowded = SWOT.find((f) => list(data, f.key).length > 7);
    if (crowded) {
      checks.push({
        id: "crowded",
        level: "warn",
        field: crowded.key,
        message: {
          th: `"${crowded.label.th}" มีมากกว่า 7 ข้อ เลือกเฉพาะที่สำคัญ`,
          en: `"${crowded.label.en}" has more than 7 items. Keep what matters.`,
        },
      });
    }
    return checks;
  },
  summarize: (data: Data, lang: Lang) => listSummary(data, TOWS, lang, 1),
};
