import { list, t } from "../helpers";
import type { Check, Data, FieldDef, L, Lang, StructuredDef } from "./types";

const block = (key: string, label: L, hint: L, example: L, extra: Partial<FieldDef> = {}): FieldDef => ({
  key,
  type: "list",
  label,
  hint,
  example,
  ...extra,
});

export const BMC_BLOCKS = {
  partners: block(
    "partners",
    t("พันธมิตรหลัก", "Key partners"),
    t("ใครช่วยให้ธุรกิจทำงานได้โดยเราไม่ต้องทำเอง", "Who helps the business work so we don't have to do it ourselves?"),
    t("ฟาร์มผักออร์แกนิกในนครปฐม", "Organic vegetable farm in Nakhon Pathom"),
  ),
  activities: block(
    "activities",
    t("กิจกรรมหลัก", "Key activities"),
    t("สิ่งที่ต้องทำได้ดีที่สุดเพื่อส่งมอบคุณค่า", "What we must do best to deliver the value."),
    t("เตรียมอาหารสดทุกเช้า, จัดส่งรอบเที่ยง", "Prepare fresh food every morning, lunch delivery runs"),
  ),
  resources: block(
    "resources",
    t("ทรัพยากรหลัก", "Key resources"),
    t("สิ่งที่ต้องมี เช่น คน เทคโนโลยี แบรนด์ สถานที่", "What we must have: people, technology, brand, locations."),
    t("ครัวกลาง, เชฟ 2 คน, ระบบสั่งผ่าน LINE", "Central kitchen, 2 chefs, LINE ordering"),
  ),
  valueProps: block(
    "valueProps",
    t("คุณค่าที่นำเสนอ", "Value propositions"),
    t("ลูกค้าได้อะไรที่หาจากที่อื่นได้ยาก", "What customers get that is hard to find elsewhere."),
    t("มื้อเที่ยงสุขภาพส่งถึงโต๊ะใน 15 นาที", "Healthy lunch at your desk in 15 minutes"),
    { profileKey: "offering" },
  ),
  relationships: block(
    "relationships",
    t("ความสัมพันธ์กับลูกค้า", "Customer relationships"),
    t("เราดูแลและรักษาลูกค้าอย่างไร", "How we look after and keep customers."),
    t("สมาชิกรายเดือน, แอดมิน LINE ตอบภายใน 5 นาที", "Monthly membership, LINE admin replies within 5 minutes"),
  ),
  channels: block(
    "channels",
    t("ช่องทาง", "Channels"),
    t("ลูกค้ารู้จัก ซื้อ และรับสินค้าผ่านทางไหน", "How customers hear about, buy and receive the product."),
    t("LINE OA, ฝ่าย HR ของบริษัท, ไรเดอร์ของร้าน", "LINE OA, company HR teams, our own riders"),
  ),
  segments: block(
    "segments",
    t("กลุ่มลูกค้า", "Customer segments"),
    t("เริ่มที่นี่: ใครคือลูกค้าที่สำคัญที่สุด", "Start here: who are the most important customers?"),
    t("พนักงานออฟฟิศย่านสีลม-สาทร", "Office workers in Silom–Sathorn"),
    { profileKey: "targetCustomers" },
  ),
  costs: block(
    "costs",
    t("โครงสร้างต้นทุน", "Cost structure"),
    t("ต้นทุนก้อนใหญ่ที่สุดคืออะไร คงที่หรือผันแปร", "The biggest costs, fixed or variable."),
    t("วัตถุดิบ 35%, ค่าแรง 25%, ค่าเช่าครัว", "Ingredients 35%, labour 25%, kitchen rent"),
  ),
  revenue: block(
    "revenue",
    t("กระแสรายได้", "Revenue streams"),
    t("ลูกค้าจ่ายเงินเพื่ออะไร จ่ายอย่างไร", "What customers pay for, and how."),
    t("ขายรายมื้อ 120 บาท, แพ็กเกจรายเดือน", "120 THB per meal, monthly packages"),
    { profileKey: "revenueModel" },
  ),
};

export const bmc: StructuredDef = {
  key: "bmc",
  view: "canvas",
  canvas: {
    linkAnchor: "segments",
    boards: [
      {
        columns: 10,
        areas: [
          "partners partners activities activities valueProps valueProps relationships relationships segments segments",
          "partners partners resources resources valueProps valueProps channels channels segments segments",
          "costs costs costs costs costs revenue revenue revenue revenue revenue",
        ],
        cells: [
          { area: "partners", fields: ["partners"] },
          { area: "activities", fields: ["activities"] },
          { area: "resources", fields: ["resources"] },
          { area: "valueProps", fields: ["valueProps"], tone: "accent" },
          { area: "relationships", fields: ["relationships"] },
          { area: "channels", fields: ["channels"] },
          { area: "segments", fields: ["segments"], tone: "accent" },
          { area: "costs", fields: ["costs"] },
          { area: "revenue", fields: ["revenue"] },
        ],
      },
      { columns: 1, areas: ["fit"], cells: [{ area: "fit", fields: ["fitStory"] }] },
    ],
  },
  steps: [
    {
      id: "who-what",
      title: t("ลูกค้าและคุณค่า", "Customers and value"),
      intro: t(
        "เริ่มจาก customer segments และ value proposition ตามที่ cheat sheet แนะนำ",
        "Start with customer segments and value proposition, as the cheat sheet recommends.",
      ),
      fields: [BMC_BLOCKS.segments, BMC_BLOCKS.valueProps],
    },
    {
      id: "deliver",
      title: t("การส่งมอบ", "Delivery"),
      fields: [BMC_BLOCKS.channels, BMC_BLOCKS.relationships],
    },
    {
      id: "revenue",
      title: t("รายได้", "Revenue"),
      fields: [BMC_BLOCKS.revenue],
    },
    {
      id: "engine",
      title: t("สิ่งที่ทำให้ธุรกิจเดินได้", "What makes it run"),
      fields: [BMC_BLOCKS.activities, BMC_BLOCKS.resources, BMC_BLOCKS.partners],
    },
    {
      id: "costs",
      title: t("ต้นทุน", "Costs"),
      fields: [BMC_BLOCKS.costs],
    },
    {
      id: "fit",
      title: t("เช็กความสอดคล้อง", "Fit check"),
      intro: t(
        "กับดักที่พบบ่อยคือกรอกแยกช่อง ลองเล่าเป็นเรื่องเดียวว่าแต่ละช่องเชื่อมกันอย่างไร",
        "The common trap is filling blocks separately. Tell it as one story of how the blocks connect.",
      ),
      fields: [
        {
          key: "fitStory",
          type: "textarea",
          label: t("เรื่องเดียวที่เชื่อม 9 ช่อง", "One story that connects the 9 blocks"),
          hint: t(
            "เช่น \"[กลุ่มลูกค้า] ซื้อ [คุณค่า] ผ่าน [ช่องทาง] และจ่าย [รายได้] ซึ่งเราทำได้เพราะ [กิจกรรม/ทรัพยากร]\"",
            "E.g. \"[Segment] buys [value] through [channel] and pays [revenue], which we can deliver because of [activities/resources].\"",
          ),
        },
      ],
    },
  ],
  example: {
    segments: ["พนักงานออฟฟิศย่านสีลม-สาทร", "ฝ่าย HR ที่ดูแลสวัสดิการพนักงาน"],
    valueProps: ["มื้อเที่ยงสุขภาพส่งถึงโต๊ะใน 15 นาที", "สวัสดิการอาหารที่ HR จัดการง่าย"],
    channels: ["LINE OA", "ติดต่อ HR โดยตรง", "ไรเดอร์ของร้าน"],
    relationships: ["สมาชิกรายเดือน", "แอดมินตอบใน 5 นาที"],
    revenue: ["ขายรายมื้อ 120 บาท", "แพ็กเกจบริษัทรายเดือน"],
    activities: ["เตรียมอาหารสดทุกเช้า", "จัดส่งรอบเที่ยง"],
    resources: ["ครัวกลาง", "เชฟ 2 คน", "ระบบสั่งผ่าน LINE"],
    partners: ["ฟาร์มผักออร์แกนิก", "ผู้ให้บริการบรรจุภัณฑ์รักษ์โลก"],
    costs: ["วัตถุดิบ 35%", "ค่าแรง 25%", "ค่าเช่าครัว"],
  },
  checks(data: Data): Check[] {
    const checks: Check[] = [];
    const empty = Object.values(BMC_BLOCKS).filter((f) => list(data, f.key).length === 0);
    if (empty.length > 0) {
      checks.push({
        id: "empty-blocks",
        level: empty.length > 4 ? "error" : "warn",
        field: empty[0].key,
        message: {
          th: `ยังว่าง ${empty.length} ช่อง: ${empty.map((f) => f.label.th).join(", ")}`,
          en: `${empty.length} blocks still empty: ${empty.map((f) => f.label.en).join(", ")}`,
        },
      });
    }
    if (list(data, "segments").length > 3) {
      checks.push({
        id: "too-many-segments",
        level: "warn",
        field: "segments",
        message: t(
          "มีกลุ่มลูกค้ามากกว่า 3 กลุ่ม ลองเลือกกลุ่มหลักที่สำคัญที่สุดก่อน",
          "More than 3 customer segments. Pick the most important one first.",
        ),
      });
    }
    if (list(data, "segments").length > 0 && list(data, "valueProps").length === 0) {
      checks.push({
        id: "segment-without-value",
        level: "error",
        field: "valueProps",
        message: t("มีกลุ่มลูกค้าแต่ยังไม่มีคุณค่าที่เสนอให้เขา", "There are segments but no value proposition for them."),
      });
    }
    if (!data.fitStory || (typeof data.fitStory === "string" && !data.fitStory.trim())) {
      checks.push({
        id: "no-fit",
        level: "warn",
        field: "fitStory",
        message: t(
          "ยังไม่ได้เช็กว่าแต่ละช่องสอดคล้องกัน (กับดักที่พบบ่อย)",
          "The blocks haven't been checked for fit yet (common trap).",
        ),
      });
    }
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const pick = (key: keyof typeof BMC_BLOCKS) => list(data, key).slice(0, 2).join(", ");
    const out: string[] = [];
    if (pick("segments")) out.push(`${lang === "th" ? "ลูกค้า" : "Customers"}: ${pick("segments")}`);
    if (pick("valueProps")) out.push(`${lang === "th" ? "คุณค่า" : "Value"}: ${pick("valueProps")}`);
    if (pick("revenue")) out.push(`${lang === "th" ? "รายได้" : "Revenue"}: ${pick("revenue")}`);
    return out;
  },
};
