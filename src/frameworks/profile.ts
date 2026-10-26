import { t } from "./helpers";
import type { FieldDef, ProfileKey } from "./types";

/** Basic business facts collected once per project and reused by every framework. */
export const PROFILE_FIELDS: (FieldDef & { key: ProfileKey })[] = [
  {
    key: "businessName",
    type: "text",
    label: t("ชื่อธุรกิจ", "Business name"),
  },
  {
    key: "offering",
    type: "textarea",
    label: t("ขายอะไร", "What it sells"),
    hint: t("สินค้าหรือบริการหลัก อธิบายแบบที่ลูกค้าเข้าใจ", "Main products or services, in the customer's words."),
    example: t("ข้าวกล่องสุขภาพส่งถึงออฟฟิศ", "Healthy lunch boxes delivered to offices"),
  },
  {
    key: "targetCustomers",
    type: "textarea",
    label: t("ลูกค้าหลักคือใคร", "Main customers"),
    example: t("พนักงานออฟฟิศย่านสีลม-สาทร อายุ 25–40", "Office workers in Silom–Sathorn aged 25–40"),
  },
  {
    key: "revenueModel",
    type: "textarea",
    label: t("ได้เงินอย่างไร", "How it makes money"),
    example: t("ขายรายมื้อ และแพ็กเกจรายเดือนให้บริษัท", "Per meal, plus monthly packages for companies"),
  },
  {
    key: "monthlyRevenue",
    type: "text",
    label: t("รายได้ต่อเดือนโดยประมาณ", "Approximate monthly revenue"),
    example: t("ประมาณ 450,000 บาท", "About 450,000 THB"),
  },
  {
    key: "teamSize",
    type: "text",
    label: t("ขนาดทีม", "Team size"),
    example: t("12 คน", "12 people"),
  },
  {
    key: "competitors",
    type: "list",
    label: t("คู่แข่งหรือทางเลือกที่ลูกค้าใช้แทน", "Competitors or alternatives customers use"),
  },
  {
    key: "challenges",
    type: "list",
    label: t("ปัญหาที่กังวลตอนนี้", "Current concerns"),
  },
  {
    key: "goals",
    type: "textarea",
    label: t("เป้าหมายใน 1–2 ปี", "Goals for the next 1–2 years"),
  },
];

/** The facts frameworks reuse most; the project checklist asks for these first. */
export const PROFILE_BASICS: ProfileKey[] = ["businessName", "offering", "targetCustomers", "revenueModel"];
