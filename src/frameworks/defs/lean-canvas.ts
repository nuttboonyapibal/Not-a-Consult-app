import { containsAny, list, str, t } from "../helpers";
import { emptyWarnings, items, listField, listSummary, textField } from "./fields";
import type { Check, Data, Lang, StructuredDef } from "./types";

const F = {
  problem: listField(
    "problem",
    t("ปัญหา (1–3 ข้อ)", "Problem (top 1–3)"),
    t("ปัญหาที่ลูกค้าเจอจริงและยอมจ่ายเพื่อแก้ เรียงจากสำคัญที่สุด", "Real problems customers pay to solve, most important first."),
    t("พนักงานออฟฟิศไม่มีเวลาออกไปกินข้าว", "Office workers have no time to go out for lunch"),
  ),
  alternatives: listField(
    "alternatives",
    t("ทางเลือกที่ใช้อยู่", "Existing alternatives"),
    t("ตอนนี้ลูกค้าแก้ปัญหานี้อย่างไร", "How customers solve it today."),
    t("Delivery app, ข้ามมื้อ", "Delivery apps, skipping lunch"),
  ),
  segments: listField(
    "segments",
    t("กลุ่มลูกค้า", "Customer segments"),
    undefined,
    t("พนักงานออฟฟิศสีลม-สาทร", "Office workers in Silom–Sathorn"),
    { profileKey: "targetCustomers" },
  ),
  earlyAdopters: listField(
    "earlyAdopters",
    t("Early adopters", "Early adopters"),
    t("กลุ่มที่เจ็บปัญหานี้ที่สุดและจะซื้อก่อนคนอื่น", "Who feels the problem most and will buy first."),
    t("คนที่สั่ง delivery เกิน 3 วันต่อสัปดาห์", "People ordering delivery 3+ days a week"),
  ),
  uvp: textField(
    "uvp",
    t("คุณค่าที่ไม่เหมือนใคร (UVP)", "Unique value proposition"),
    t("ประโยคเดียวที่บอกว่าทำไมเราต่างและควรค่ากับความสนใจ", "One sentence on why we are different and worth attention."),
    t("มื้อเที่ยงสุขภาพถึงโต๊ะใน 15 นาที ไม่มีค่าส่ง", "Healthy lunch at your desk in 15 minutes, no delivery fee"),
    { profileKey: "offering" },
  ),
  concept: {
    key: "concept",
    type: "text" as const,
    label: t("เปรียบให้เห็นภาพ (high-level concept)", "High-level concept"),
    example: t("ข้าวกล่องแบบสมาชิกสำหรับออฟฟิศ", "Meal subscription for offices"),
  },
  solution: listField(
    "solution",
    t("ทางแก้", "Solution"),
    t("ฟีเจอร์หรือวิธีที่แก้แต่ละปัญหา จับคู่กับปัญหาด้านซ้าย", "What solves each problem, matched to the problems."),
  ),
  channels: listField("channels", t("ช่องทาง", "Channels"), t("ทางที่เข้าถึงลูกค้าได้จริงและซ้ำได้", "Paths to customers that work and repeat.")),
  revenue: listField("revenue", t("รายได้", "Revenue streams"), undefined, undefined, { profileKey: "revenueModel" }),
  costs: listField("costs", t("ต้นทุน", "Cost structure")),
  metrics: listField(
    "metrics",
    t("ตัวชี้วัดหลัก", "Key metrics"),
    t("ตัวเลขไม่กี่ตัวที่บอกว่าธุรกิจเดินหน้าจริง", "The few numbers that show real progress."),
    t("อัตราสั่งซ้ำใน 30 วัน", "30-day reorder rate"),
  ),
  unfairAdvantage: listField(
    "unfairAdvantage",
    t("Unfair advantage", "Unfair advantage"),
    t("สิ่งที่คู่แข่งซื้อหรือลอกไม่ได้ง่ายๆ ถ้ายังไม่มีให้เว้นว่างไว้ดีกว่าเขียนคำกว้างๆ", "What competitors can't easily buy or copy. Leave it empty rather than write something generic."),
    t("สัญญาเช่าครัวกลางใจกลาง CBD ระยะ 5 ปี", "A 5-year lease on a central kitchen in the CBD"),
  ),
};

const GENERIC_ADVANTAGE = [
  "ราคาถูก",
  "ถูกกว่า",
  "คุณภาพดี",
  "บริการดี",
  "ใส่ใจ",
  "ทีมเก่ง",
  "ประสบการณ์",
  "cheap",
  "low price",
  "quality",
  "service",
  "passion",
  "experienced",
];

export const leanCanvas: StructuredDef = {
  key: "lean-canvas",
  view: "canvas",
  steps: [
    { id: "problem", title: t("ปัญหาและลูกค้า", "Problem and customers"), fields: [F.problem, F.alternatives, F.segments, F.earlyAdopters] },
    { id: "uvp", title: t("คุณค่าที่ไม่เหมือนใคร", "Unique value"), fields: [F.uvp, F.concept] },
    { id: "solution", title: t("ทางแก้", "Solution"), fields: [F.solution] },
    { id: "money", title: t("ช่องทางและตัวเงิน", "Channels and money"), fields: [F.channels, F.revenue, F.costs] },
    { id: "edge", title: t("ตัวชี้วัดและความได้เปรียบ", "Metrics and advantage"), fields: [F.metrics, F.unfairAdvantage] },
  ],
  canvas: {
    linkAnchor: "segments",
    boards: [
      {
        columns: 10,
        areas: [
          "problem problem solution solution uvp uvp unfair unfair segments segments",
          "problem problem metrics metrics uvp uvp channels channels segments segments",
          "costs costs costs costs costs revenue revenue revenue revenue revenue",
        ],
        cells: [
          { area: "problem", fields: ["problem", "alternatives"], title: t("ปัญหา", "Problem") },
          { area: "solution", fields: ["solution"] },
          { area: "uvp", fields: ["uvp", "concept"], title: t("คุณค่า", "Value"), tone: "accent" },
          { area: "unfair", fields: ["unfairAdvantage"] },
          { area: "segments", fields: ["segments", "earlyAdopters"], title: t("ลูกค้า", "Customers"), tone: "accent" },
          { area: "metrics", fields: ["metrics"] },
          { area: "channels", fields: ["channels"] },
          { area: "costs", fields: ["costs"] },
          { area: "revenue", fields: ["revenue"] },
        ],
      },
    ],
  },
  example: {
    problem: items("พนักงานออฟฟิศไม่มีเวลาออกไปกินข้าว", "อาหาร delivery ส่วนใหญ่ไม่ดีต่อสุขภาพ", "ค่าส่งแพงเมื่อสั่งคนเดียว"),
    alternatives: items("Delivery app", "ร้านสะดวกซื้อ", "ข้ามมื้อ"),
    segments: items(["พนักงานออฟฟิศสีลม-สาทร", "blue"]),
    earlyAdopters: items(["คนที่สั่ง delivery เกิน 3 วันต่อสัปดาห์", "blue"]),
    uvp: "มื้อเที่ยงสุขภาพถึงโต๊ะใน 15 นาที ไม่มีค่าส่ง",
    concept: "ข้าวกล่องสุขภาพแบบสมาชิกสำหรับออฟฟิศ",
    solution: items("ครัวกลางใกล้ออฟฟิศ", "รอบส่งตายตัว 11:45", "เมนูคุมแคลอรี่เปลี่ยนทุกสัปดาห์"),
    channels: items("LINE OA", "HR บริษัท"),
    revenue: items("รายมื้อ 120 บาท", "แพ็กเกจรายเดือน"),
    costs: items("วัตถุดิบ", "ค่าแรงครัว", "ไรเดอร์"),
    metrics: items("จำนวนมื้อต่อสมาชิกต่อสัปดาห์", "อัตราสั่งซ้ำ 30 วัน"),
    unfairAdvantage: items("สัญญาเช่าครัวกลางใจกลาง CBD ระยะ 5 ปี"),
  },
  checks(data: Data): Check[] {
    const checks = emptyWarnings(data, [F.problem, F.segments, F.uvp, F.solution, F.metrics]);
    if (list(data, "problem").length > 3) {
      checks.push({
        id: "too-many-problems",
        level: "warn",
        field: "problem",
        message: t("มีปัญหามากกว่า 3 ข้อ เลือกเฉพาะที่ลูกค้าเจ็บที่สุด", "More than 3 problems. Keep the ones that hurt most."),
      });
    }
    const advantage = list(data, "unfairAdvantage");
    if (advantage.length === 0) {
      checks.push({
        id: "no-advantage",
        level: "warn",
        field: "unfairAdvantage",
        message: t("ยังไม่มี unfair advantage ไม่เป็นไรสำหรับธุรกิจใหม่ แต่ต้องรู้ว่ายังไม่มี", "No unfair advantage yet. Fine for a new business, as long as you know it."),
      });
    } else if (containsAny(advantage.join(" "), GENERIC_ADVANTAGE)) {
      checks.push({
        id: "copyable-advantage",
        level: "warn",
        field: "unfairAdvantage",
        message: t(
          "unfair advantage ดูเป็นสิ่งที่คู่แข่งลอกได้ง่าย (กับดักที่พบบ่อย) ลองถามว่าคู่แข่งที่มีเงินทำตามได้ใน 6 เดือนไหม",
          "This unfair advantage looks easy to copy (common trap). Could a well-funded rival match it in 6 months?",
        ),
      });
    }
    if (list(data, "segments").length > 0 && list(data, "earlyAdopters").length === 0) {
      checks.push({
        id: "no-early-adopters",
        level: "warn",
        field: "earlyAdopters",
        message: t("ระบุกลุ่มที่จะซื้อก่อนคนอื่น เพื่อรู้ว่าจะเริ่มทดสอบกับใคร", "Name who will buy first, so you know who to test with."),
      });
    }
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const out = listSummary(data, [F.problem, F.segments], lang);
    if (str(data, "uvp")) out.push(`UVP: ${str(data, "uvp")}`);
    return out;
  },
};
