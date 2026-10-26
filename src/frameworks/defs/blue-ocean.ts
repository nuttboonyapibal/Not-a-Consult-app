import { list, t } from "../helpers";
import { emptyWarnings, items, listField, listSummary } from "./fields";
import type { Check, Data, Lang, StructuredDef } from "./types";

const F = {
  factors: listField(
    "factors",
    t("ปัจจัยที่อุตสาหกรรมแข่งกันอยู่", "Factors the industry competes on"),
    t("สิ่งที่ทุกเจ้าแข่งกัน เช่น ราคา จำนวนเมนู ความเร็ว", "What everyone competes on, e.g. price, menu size, speed."),
  ),
  eliminate: listField("eliminate", t("ตัด (Eliminate)", "Eliminate"), t("สิ่งที่อุตสาหกรรมถือว่าต้องมี แต่ตัดทิ้งได้", "What the industry takes for granted but can go.")),
  reduce: listField("reduce", t("ลด (Reduce)", "Reduce"), t("สิ่งที่ทำมากเกินมาตรฐานที่ลูกค้าต้องการ", "What is overdone beyond what customers need.")),
  raise: listField("raise", t("เพิ่ม (Raise)", "Raise"), t("สิ่งที่ควรดีกว่ามาตรฐานอุตสาหกรรมมาก", "What should be well above the industry standard.")),
  create: listField("create", t("สร้างใหม่ (Create)", "Create"), t("สิ่งที่อุตสาหกรรมไม่เคยเสนอ", "What the industry has never offered.")),
};

export const blueOcean: StructuredDef = {
  key: "blue-ocean",
  view: "canvas",
  steps: [
    { id: "factors", title: t("มาตรฐานของอุตสาหกรรม", "Industry standard"), fields: [F.factors] },
    {
      id: "errc",
      title: t("ตัด ลด เพิ่ม สร้างใหม่", "Eliminate, reduce, raise, create"),
      intro: t("กล้าตัดและลด ไม่ใช่แค่เพิ่ม", "Dare to cut and reduce, not only add."),
      fields: [F.eliminate, F.reduce, F.raise, F.create],
    },
  ],
  canvas: {
    boards: [
      { columns: 1, areas: ["factors"], cells: [{ area: "factors", fields: ["factors"] }] },
      {
        columns: 2,
        areas: ["eliminate raise", "reduce create"],
        cells: [
          { area: "eliminate", fields: ["eliminate"], tone: "err" },
          { area: "raise", fields: ["raise"], tone: "ok" },
          { area: "reduce", fields: ["reduce"], tone: "warn" },
          { area: "create", fields: ["create"], tone: "accent" },
        ],
      },
    ],
  },
  example: {
    factors: items("ราคา", "จำนวนเมนู", "ความเร็วในการส่ง", "โปรโมชั่น"),
    eliminate: items("ค่าส่ง"),
    reduce: items("จำนวนเมนูต่อวัน (เหลือ 4)"),
    raise: items("ความตรงเวลา", "ความใส่ใจด้านสุขภาพ"),
    create: items("แพ็กเกจสวัสดิการที่ HR จัดการได้ในที่เดียว"),
  },
  checks(data: Data): Check[] {
    const checks = emptyWarnings(data, [F.factors]);
    const adds = list(data, "raise").length + list(data, "create").length;
    const cuts = list(data, "eliminate").length + list(data, "reduce").length;
    if (adds > 0 && cuts === 0) {
      checks.push({
        id: "only-adding",
        level: "warn",
        field: "eliminate",
        message: t(
          "มีแต่เพิ่มและสร้าง ยังไม่ได้ตัดหรือลดอะไร (กับดักที่พบบ่อย) การเพิ่มอย่างเดียวทำให้ต้นทุนสูงขึ้น",
          "Only raising and creating, nothing cut or reduced (common trap). Adding alone raises costs.",
        ),
      });
    }
    if (adds + cuts === 0 && list(data, "factors").length > 0) {
      checks.push({
        id: "no-errc",
        level: "warn",
        field: "eliminate",
        message: t("ยังไม่ได้เลือกว่าจะตัด ลด เพิ่ม หรือสร้างอะไร", "Nothing chosen to eliminate, reduce, raise or create yet."),
      });
    }
    return checks;
  },
  summarize: (data: Data, lang: Lang) => listSummary(data, [F.eliminate, F.reduce, F.raise, F.create], lang, 2),
};
