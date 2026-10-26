import { list, str, t } from "../helpers";
import { items, LEVELS, listField, selectField, textField } from "./fields";
import type { Check, Data, FieldDef, L, Lang, StructuredDef } from "./types";

const FORCES: { key: string; name: L; hint: L }[] = [
  { key: "rivalry", name: t("การแข่งขันของคู่แข่งเดิม", "Rivalry among competitors"), hint: t("มีคู่แข่งกี่ราย แข่งกันแรงแค่ไหน", "How many rivals, how fiercely they compete.") },
  { key: "newEntrants", name: t("ผู้เล่นใหม่", "Threat of new entrants"), hint: t("เข้ามาในตลาดนี้ง่ายแค่ไหน", "How easy it is to enter this market.") },
  {
    key: "substitutes",
    name: t("สินค้าทดแทน", "Threat of substitutes"),
    hint: t("ลูกค้าใช้อะไรอื่นแทนได้ แม้ไม่ใช่คู่แข่งตรง", "What else customers could use, even if not a direct rival."),
  },
  { key: "supplierPower", name: t("อำนาจซัพพลายเออร์", "Supplier power"), hint: t("ซัพพลายเออร์ขึ้นราคาหรือกำหนดเงื่อนไขได้แค่ไหน", "How much suppliers can raise prices or set terms.") },
  { key: "buyerPower", name: t("อำนาจลูกค้า", "Buyer power"), hint: t("ลูกค้าต่อรองหรือเปลี่ยนเจ้าได้ง่ายแค่ไหน", "How easily customers negotiate or switch.") },
];

const forceFields = (f: (typeof FORCES)[number]): FieldDef[] => [
  { ...selectField(`${f.key}Level`, { th: `${f.name.th}: ระดับแรงกดดัน`, en: `${f.name.en}: pressure` }, LEVELS, f.hint), short: t("ระดับแรงกดดัน", "Pressure") },
  { ...listField(`${f.key}Notes`, { th: `${f.name.th}: เหตุผล`, en: `${f.name.en}: why` }), short: t("เหตุผล", "Why") },
];

const attractiveness = selectField("attractiveness", t("อุตสาหกรรมนี้น่าเล่นแค่ไหน", "How attractive is this industry"), LEVELS);
const profitFlow = textField("profitFlow", t("กำไรไหลไปที่ใคร", "Who captures the profit"));

export const fiveForces: StructuredDef = {
  key: "five-forces",
  view: "canvas",
  steps: [
    ...FORCES.map((f) => ({ id: f.key, title: f.name, intro: f.hint, fields: forceFields(f) })),
    { id: "verdict", title: t("สรุป", "Verdict"), fields: [attractiveness, profitFlow] },
  ],
  canvas: {
    boards: [
      {
        columns: 3,
        cards: true,
        areas: [". newEntrants .", "supplierPower rivalry buyerPower", ". substitutes ."],
        cells: FORCES.map((f) => ({
          area: f.key,
          fields: [`${f.key}Level`, `${f.key}Notes`],
          title: f.name,
          tone: f.key === "rivalry" ? ("accent" as const) : undefined,
        })),
      },
      {
        columns: 2,
        cards: true,
        areas: ["attractiveness profitFlow"],
        cells: [
          { area: "attractiveness", fields: ["attractiveness"] },
          { area: "profitFlow", fields: ["profitFlow"] },
        ],
      },
    ],
  },
  example: {
    rivalryLevel: "high",
    rivalryNotes: items("delivery app หลายเจ้า", "ร้านข้าวกล่องในตึก"),
    newEntrantsLevel: "medium",
    newEntrantsNotes: items("เปิดครัวง่าย แต่ทำสัญญากับ HR ยาก"),
    substitutesLevel: "high",
    substitutesNotes: items("ร้านสะดวกซื้อ", "ทำอาหารมาเอง", "ข้ามมื้อ"),
    supplierPowerLevel: "low",
    supplierPowerNotes: items("ซัพพลายเออร์ผักมีหลายราย"),
    buyerPowerLevel: "medium",
    buyerPowerNotes: items("HR ต่อรองราคาได้เมื่อสั่งจำนวนมาก"),
    attractiveness: "medium",
    profitFlow: "กำไรไหลไปที่แพลตฟอร์ม delivery ที่เก็บค่าคอม 30% ถ้าขายตรงกับ HR ได้ จะเก็บกำไรไว้เองได้มากกว่า",
  },
  checks(data: Data): Check[] {
    const checks: Check[] = [];
    if (list(data, "substitutesNotes").length === 0) {
      checks.push({
        id: "no-substitutes",
        level: "warn",
        field: "substitutesNotes",
        message: t(
          "ยังไม่ได้ดูสินค้าทดแทน (กับดักที่พบบ่อย: มองแค่คู่แข่งตรง)",
          "Substitutes not considered yet (common trap: looking only at direct rivals).",
        ),
      });
    }
    const unrated = FORCES.filter((f) => !str(data, `${f.key}Level`));
    if (unrated.length) {
      checks.push({
        id: "unrated",
        level: "warn",
        field: `${unrated[0].key}Level`,
        message: {
          th: `ยังไม่ได้ให้ระดับ: ${unrated.map((f) => f.name.th).join(", ")}`,
          en: `Not rated yet: ${unrated.map((f) => f.name.en).join(", ")}`,
        },
      });
    }
    if (!str(data, "attractiveness")) {
      checks.push({ id: "no-verdict", level: "warn", field: "attractiveness", message: t("ยังไม่ได้สรุปว่าน่าเล่นแค่ไหน", "No verdict on attractiveness yet.") });
    }
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const high = FORCES.filter((f) => str(data, `${f.key}Level`) === "high").map((f) => f.name[lang]);
    const out: string[] = [];
    if (high.length) out.push(`${lang === "th" ? "แรงกดดันสูง" : "High pressure"}: ${high.join(", ")}`);
    if (str(data, "profitFlow")) out.push(str(data, "profitFlow"));
    return out;
  },
};
