import { list, str, t } from "../helpers";
import { items, listField, selectField, textField } from "./fields";
import type { Check, Data, Lang, Option, StructuredDef } from "./types";

const PATHS = {
  penetration: { th: "เจาะตลาดเดิม", en: "Market penetration" },
  productDev: { th: "พัฒนาสินค้าใหม่", en: "Product development" },
  marketDev: { th: "ขยายตลาดใหม่", en: "Market development" },
  diversification: { th: "กระจายธุรกิจ", en: "Diversification" },
};

const OPTIONS: Option[] = (Object.keys(PATHS) as (keyof typeof PATHS)[]).map((k) => ({ value: k, label: PATHS[k] }));

const F = {
  penetration: listField(
    "penetration",
    t("เจาะตลาดเดิม (เสี่ยงต่ำ)", "Market penetration (lowest risk)"),
    t("ขายสินค้าเดิมให้ลูกค้าเดิมมากขึ้น", "Sell more of today's products to today's customers."),
  ),
  productDev: listField("productDev", t("พัฒนาสินค้าใหม่", "Product development"), t("สินค้าใหม่ให้ลูกค้าเดิม", "New products for today's customers.")),
  marketDev: listField("marketDev", t("ขยายตลาดใหม่", "Market development"), t("สินค้าเดิมในตลาดหรือกลุ่มลูกค้าใหม่", "Today's products in new markets or segments.")),
  diversification: listField(
    "diversification",
    t("กระจายธุรกิจ (เสี่ยงสูงสุด)", "Diversification (highest risk)"),
    t("สินค้าใหม่ในตลาดใหม่", "New products in new markets."),
  ),
  chosen: selectField("chosen", t("ทางที่เลือก", "Chosen path"), OPTIONS),
  reason: textField("reason", t("ทำไมเลือกทางนี้", "Why this path")),
};

export const ansoff: StructuredDef = {
  key: "ansoff",
  view: "canvas",
  steps: [
    { id: "options", title: t("ทางเลือกในการโต", "Growth options"), fields: [F.penetration, F.productDev, F.marketDev, F.diversification] },
    { id: "choice", title: t("เลือกทาง", "Choose"), fields: [F.chosen, F.reason] },
  ],
  canvas: {
    boards: [
      {
        columns: 2,
        areas: ["penetration productDev", "marketDev diversification"],
        cells: [
          { area: "penetration", fields: ["penetration"], tone: "ok" },
          { area: "productDev", fields: ["productDev"], tone: "accent" },
          { area: "marketDev", fields: ["marketDev"], tone: "accent" },
          { area: "diversification", fields: ["diversification"], tone: "warn" },
        ],
        axes: {
          x: [t("สินค้าเดิม", "Existing products"), t("สินค้าใหม่", "New products")],
          y: [t("ตลาดเดิม", "Existing markets"), t("ตลาดใหม่", "New markets")],
        },
      },
      {
        columns: 2,
        areas: ["chosen reason"],
        cells: [
          { area: "chosen", fields: ["chosen"] },
          { area: "reason", fields: ["reason"] },
        ],
      },
    ],
  },
  example: {
    penetration: items("เพิ่มความถี่ลูกค้าเดิมด้วยแพ็กเกจรายเดือน"),
    productDev: items("อาหารเย็นแช่แข็งให้ลูกค้าเดิม"),
    marketDev: items("ขยายไปย่านอโศก"),
    diversification: items("เปิดคาเฟ่สุขภาพ"),
    chosen: "penetration",
    reason: "ลูกค้าเดิมยังสั่งไม่ถึงสัปดาห์ละครั้ง เพิ่มความถี่ได้ด้วยต้นทุนต่ำที่สุด",
  },
  checks(data: Data): Check[] {
    const checks: Check[] = [];
    const chosen = str(data, "chosen");
    if (!chosen) {
      checks.push({ id: "no-choice", level: "warn", field: "chosen", message: t("ยังไม่ได้เลือกทาง", "No path chosen yet.") });
    } else if (!str(data, "reason")) {
      checks.push({ id: "no-reason", level: "warn", field: "reason", message: t("ยังไม่ได้บอกเหตุผล", "No reason given.") });
    }
    if (chosen === "diversification" && list(data, "penetration").length === 0) {
      checks.push({
        id: "diversify-first",
        level: "warn",
        field: "penetration",
        message: t(
          "เลือกกระจายธุรกิจ แต่ยังไม่ได้ดูทางเจาะตลาดเดิม (กับดักที่พบบ่อย: กระโดดก่อนชนะตลาดเดิม)",
          "Diversification chosen without looking at penetration (common trap: jumping before winning the current market).",
        ),
      });
    }
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const chosen = str(data, "chosen") as keyof typeof PATHS;
    if (!PATHS[chosen]) return [];
    return [`${lang === "th" ? "ทางที่เลือก" : "Chosen path"}: ${PATHS[chosen][lang]}${str(data, "reason") ? ` — ${str(data, "reason")}` : ""}`];
  },
};
