import { list, str, t } from "../helpers";
import type { Check, Data, Lang, StructuredDef } from "./types";

export const playingToWin: StructuredDef = {
  key: "playing-to-win",
  view: "cascade",
  steps: [
    {
      id: "aspiration",
      title: t("1. เป้าหมาย", "1. Winning aspiration"),
      intro: t("ตอบ 5 คำถามตามลำดับ แต่ละข้อต้องรับกับข้อก่อนหน้า", "Answer the 5 questions in order; each must follow from the one before."),
      fields: [
        {
          key: "aspiration",
          type: "textarea",
          label: t("ชนะแปลว่าอะไรสำหรับเรา", "What does winning mean for us"),
          profileKey: "goals",
          example: t(
            "เป็นตัวเลือกแรกของมื้อเที่ยงสุขภาพสำหรับออฟฟิศย่าน CBD ภายใน 2 ปี",
            "Be the first choice for healthy office lunches in the CBD within 2 years",
          ),
        },
      ],
    },
    {
      id: "where",
      title: t("2. เล่นที่ไหน", "2. Where to play"),
      intro: t(
        "การเลือกคือการบอกว่าจะไม่เล่นที่ไหนด้วย ถ้าไม่มีอะไรที่ตัดทิ้ง แปลว่ายังไม่ได้เลือก",
        "Choosing means saying where you won't play. If nothing is ruled out, nothing was chosen.",
      ),
      fields: [
        {
          key: "whereToPlay",
          type: "list",
          label: t("เลือกเล่น (ลูกค้า พื้นที่ ช่องทาง สินค้า)", "We play in (customers, areas, channels, products)"),
          example: t("ออฟฟิศ 50–500 คนในสีลม-สาทร-อโศก", "Offices of 50–500 people in Silom, Sathorn, Asoke"),
        },
        {
          key: "whereNotToPlay",
          type: "list",
          label: t("เลือกไม่เล่น", "We don't play in"),
          example: t("ลูกค้ารายย่อยทั่วไป, ต่างจังหวัด, มื้อเย็น", "General consumers, provinces, dinner"),
        },
      ],
    },
    {
      id: "how",
      title: t("3. ชนะอย่างไร", "3. How to win"),
      fields: [
        {
          key: "howToWin",
          type: "textarea",
          label: t("ทำไมลูกค้าเป้าหมายจะเลือกเราแทนคนอื่น", "Why target customers will choose us over others"),
          example: t(
            "ส่งเร็วกว่า delivery app เพราะครัวอยู่ใกล้และรอบส่งตายตัว ราคาบริษัทจ่ายเป็นสวัสดิการได้",
            "Faster than delivery apps thanks to a nearby kitchen and fixed runs; companies can pay it as a benefit",
          ),
        },
      ],
    },
    {
      id: "capabilities",
      title: t("4. ความสามารถที่ต้องมี", "4. Must-have capabilities"),
      fields: [
        {
          key: "capabilities",
          type: "list",
          label: t("ความสามารถที่ต้องมีเพื่อชนะแบบนั้น", "Capabilities needed to win that way"),
          example: t("วางแผนรอบส่งแม่นยำ, ขายให้ HR องค์กร", "Precise delivery planning, selling to corporate HR"),
        },
      ],
    },
    {
      id: "systems",
      title: t("5. ระบบที่ต้องมี", "5. Management systems"),
      fields: [
        {
          key: "systems",
          type: "list",
          label: t("ระบบ กระบวนการ และตัวชี้วัดที่ค้ำความสามารถ", "Systems, processes and metrics that support the capabilities"),
          example: t("ระบบสั่งล่วงหน้าทาง LINE, KPI ส่งตรงเวลา 95%", "Pre-orders on LINE, 95% on-time delivery KPI"),
        },
      ],
    },
  ],
  example: {
    aspiration: "เป็นตัวเลือกแรกของมื้อเที่ยงสุขภาพสำหรับออฟฟิศย่าน CBD ภายใน 2 ปี",
    whereToPlay: ["ออฟฟิศ 50–500 คนในสีลม-สาทร-อโศก", "สั่งผ่าน HR และ LINE"],
    whereNotToPlay: ["ลูกค้ารายย่อยทั่วไป", "ต่างจังหวัด", "มื้อเย็น"],
    howToWin: "ส่งเร็วกว่า delivery app เพราะครัวอยู่ใกล้และรอบส่งตายตัว ราคาบริษัทจ่ายเป็นสวัสดิการได้",
    capabilities: ["วางแผนรอบส่งแม่นยำ", "ขายให้ HR องค์กร"],
    systems: ["ระบบสั่งล่วงหน้าทาง LINE", "KPI ส่งตรงเวลา 95%"],
  },
  checks(data: Data): Check[] {
    const checks: Check[] = [];
    const order = ["aspiration", "whereToPlay", "howToWin", "capabilities", "systems"];
    const filled = order.map((k) => (k === "whereToPlay" || k === "capabilities" || k === "systems" ? list(data, k).length > 0 : !!str(data, k)));
    const firstGap = filled.indexOf(false);
    if (firstGap >= 0 && filled.slice(firstGap).some(Boolean)) {
      checks.push({
        id: "order",
        level: "warn",
        field: order[firstGap],
        message: t(
          "ข้ามบางคำถามไป คำตอบข้อหลังควรต่อจากข้อก่อนหน้าตามลำดับ",
          "A question was skipped. Later answers should follow from earlier ones, in order.",
        ),
      });
    }
    if (list(data, "whereToPlay").length > 0 && list(data, "whereNotToPlay").length === 0) {
      checks.push({
        id: "no-choice",
        level: "warn",
        field: "whereNotToPlay",
        message: t(
          "ยังไม่ระบุที่ที่จะไม่เล่น อาจตอบ \"เล่นที่ไหน\" กว้างจนไม่ได้เลือกอะไรเลย",
          "Nothing ruled out. \"Where to play\" may be so broad that nothing was chosen.",
        ),
      });
    }
    if (list(data, "whereToPlay").length > 4) {
      checks.push({
        id: "too-broad",
        level: "warn",
        field: "whereToPlay",
        message: t("เลือกเล่นมากกว่า 4 ที่ ลองตัดให้เหลือที่ที่ชนะได้จริง", "More than 4 places to play. Cut to where you can really win."),
      });
    }
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const out: string[] = [];
    if (str(data, "aspiration")) out.push((lang === "th" ? "เป้าหมาย: " : "Aspiration: ") + str(data, "aspiration"));
    if (list(data, "whereToPlay").length)
      out.push((lang === "th" ? "เล่นที่: " : "Play in: ") + list(data, "whereToPlay").join(", "));
    if (str(data, "howToWin")) out.push((lang === "th" ? "ชนะด้วย: " : "Win by: ") + str(data, "howToWin"));
    return out;
  },
};
