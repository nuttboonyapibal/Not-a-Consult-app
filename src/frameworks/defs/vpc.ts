import { list, listItems, num, str, t, taggedTexts } from "../helpers";
import { emptyWarnings, items, listField, listSummary, textField } from "./fields";
import type { Check, Data, Lang, StructuredDef } from "./types";

const F = {
  jobs: listField(
    "jobs",
    t("งานของลูกค้า (Jobs)", "Customer jobs"),
    t("สิ่งที่ลูกค้าพยายามทำให้สำเร็จ ทั้งด้านใช้งาน อารมณ์ และสังคม", "What customers try to get done: functional, emotional, social."),
    t("ได้กินมื้อเที่ยงโดยไม่เสียเวลางาน", "Eat lunch without losing work time"),
  ),
  pains: listField(
    "pains",
    t("สิ่งที่ลูกค้าเจ็บ (Pains)", "Pains"),
    t("สิ่งที่น่ารำคาญ เสี่ยง หรือขวางไม่ให้งานสำเร็จ ติดสีให้ตรงกับ pain reliever ที่แก้มัน", "What annoys, risks or blocks the job. Color it to match the pain reliever that fixes it."),
    t("delivery มาช้าและไม่แน่นอน", "Delivery is late and unpredictable"),
  ),
  gains: listField(
    "gains",
    t("สิ่งที่ลูกค้าอยากได้ (Gains)", "Gains"),
    t("ผลลัพธ์หรือประโยชน์ที่ลูกค้าอยากได้หรือจะดีใจถ้าได้", "Outcomes and benefits customers want or would love."),
    t("ไม่ต้องคิดว่าวันนี้จะกินอะไร", "Not having to decide what to eat"),
  ),
  interviews: {
    key: "interviews",
    type: "number" as const,
    label: t("คุยกับลูกค้าจริงกี่คน", "Customers interviewed"),
    unit: t("คน", "people"),
    hint: t("ฝั่งลูกค้าต้องมาจากการคุยจริง ไม่ใช่การเดา", "The customer side must come from real conversations, not guesses."),
  },
  products: listField("products", t("สินค้าและบริการ", "Products & services"), undefined, undefined, { profileKey: "offering" }),
  painRelievers: listField(
    "painRelievers",
    t("ตัวแก้ pain (Pain relievers)", "Pain relievers"),
    t("สินค้าเราลดหรือกำจัด pain ไหน ติดสีเดียวกับ pain นั้น", "Which pain each one removes. Use the same color as that pain."),
  ),
  gainCreators: listField(
    "gainCreators",
    t("ตัวสร้าง gain (Gain creators)", "Gain creators"),
    t("สินค้าเราสร้าง gain ไหนให้ลูกค้า", "Which gain each one creates."),
  ),
  fitNotes: textField(
    "fitNotes",
    t("ความเข้ากัน (Fit)", "Fit"),
    t("pain และ gain ไหนที่เราตอบได้ดีที่สุด และไหนที่ยังไม่ได้ตอบ", "Which pains and gains we answer best, and which we don't yet."),
  ),
};

export const vpc: StructuredDef = {
  key: "vpc",
  view: "canvas",
  steps: [
    { id: "customer", title: t("Customer Profile", "Customer Profile"), intro: t("เริ่มจากฝั่งลูกค้า และเติมจากการคุยจริง", "Start with the customer, filled from real conversations."), fields: [F.jobs, F.pains, F.gains, F.interviews] },
    { id: "value", title: t("Value Map", "Value Map"), fields: [F.products, F.painRelievers, F.gainCreators] },
    { id: "fit", title: t("จับคู่", "Fit"), fields: [F.fitNotes] },
  ],
  canvas: {
    linkAnchor: "pains",
    boards: [
      {
        columns: 4,
        areas: ["products relievers jobs pains", "products creators jobs gains", "fit fit interviews interviews"],
        cells: [
          { area: "products", fields: ["products"], tone: "accent" },
          { area: "relievers", fields: ["painRelievers"], tone: "accent" },
          { area: "creators", fields: ["gainCreators"], tone: "accent" },
          { area: "jobs", fields: ["jobs"] },
          { area: "pains", fields: ["pains"] },
          { area: "gains", fields: ["gains"] },
          { area: "fit", fields: ["fitNotes"] },
          { area: "interviews", fields: ["interviews"] },
        ],
      },
    ],
  },
  example: {
    jobs: items("ได้กินมื้อเที่ยงโดยไม่เสียเวลางาน", "ดูแลสุขภาพแม้งานยุ่ง"),
    pains: items(["ไม่มีเวลาออกไปซื้อ", "blue"], ["delivery มาช้าและไม่แน่นอน", "rose"], ["อาหารมันและหนักท้อง", "green"]),
    gains: items("ไม่ต้องคิดว่าวันนี้จะกินอะไร", "รู้สึกดีที่กินอาหารดี"),
    interviews: 8,
    products: items("ข้าวกล่องสุขภาพ", "แพ็กเกจรายเดือน"),
    painRelievers: items(["ส่งถึงโต๊ะ ไม่ต้องลุก", "blue"], ["รอบส่งตายตัว 11:45", "rose"], ["เมนูคุมแคลอรี่", "green"]),
    gainCreators: items("เมนูเปลี่ยนทุกสัปดาห์ เลือกไว้ให้แล้ว"),
    fitNotes: "ตอบ pain เรื่องเวลาได้ดีที่สุด ยังไม่ได้ตอบเรื่องความหลากหลายของเมนูสำหรับคนกินมังสวิรัติ",
  },
  checks(data: Data): Check[] {
    const checks = emptyWarnings(data, [F.jobs, F.pains, F.gains, F.products]);
    const interviews = num(data, "interviews");
    if (interviews == null || interviews < 5) {
      checks.push({
        id: "few-interviews",
        level: "warn",
        field: "interviews",
        message: t(
          "คุยกับลูกค้าน้อยกว่า 5 คน ฝั่งลูกค้าอาจมาจากการเดา (กับดักที่พบบ่อย)",
          "Fewer than 5 interviews. The customer side may be guesses (common trap).",
        ),
      });
    }
    if (list(data, "pains").length > 0 && list(data, "painRelievers").length === 0) {
      checks.push({
        id: "pains-without-relievers",
        level: "error",
        field: "painRelievers",
        message: t("มี pain แต่ยังไม่มีอะไรแก้", "There are pains but nothing relieves them."),
      });
    }
    if (list(data, "gains").length > 0 && list(data, "gainCreators").length === 0) {
      checks.push({
        id: "gains-without-creators",
        level: "warn",
        field: "gainCreators",
        message: t("มี gain แต่ยังไม่มีอะไรสร้างให้", "There are gains but nothing creates them."),
      });
    }
    for (const pain of listItems(data, "pains")) {
      if (pain.tag && pain.text.trim() && taggedTexts(data, "painRelievers", pain.tag).length === 0) {
        checks.push({
          id: `unmatched-${pain.id}`,
          level: "warn",
          field: "painRelievers",
          message: {
            th: `pain "${pain.text}" ยังไม่มีตัวแก้สีเดียวกัน`,
            en: `Pain "${pain.text}" has no reliever of the same color.`,
          },
        });
      }
    }
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const out = listSummary(data, [F.pains, F.painRelievers], lang);
    if (str(data, "fitNotes")) out.push(str(data, "fitNotes"));
    return out;
  },
};
