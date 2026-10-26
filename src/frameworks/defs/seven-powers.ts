import { str, t } from "../helpers";
import { POWER_LEVELS, selectField, textField } from "./fields";
import type { Check, Data, FieldDef, L, Lang, StructuredDef } from "./types";

const POWERS: { key: string; name: L; hint: L }[] = [
  { key: "scale", name: t("Scale economies", "Scale economies"), hint: t("ต้นทุนต่อหน่วยลดลงเมื่อใหญ่ขึ้นจนคู่แข่งเล็กสู้ไม่ได้", "Unit costs fall with size until smaller rivals can't compete.") },
  { key: "network", name: t("Network effects", "Network effects"), hint: t("ยิ่งคนใช้มาก ยิ่งมีค่ากับผู้ใช้แต่ละคน", "The more people use it, the more it's worth to each.") },
  {
    key: "counterPositioning",
    name: t("Counter-positioning", "Counter-positioning"),
    hint: t("โมเดลใหม่ที่ผู้เล่นเดิมไม่ลอก เพราะจะทำร้ายธุรกิจตัวเอง", "A new model incumbents won't copy because it would hurt their own business."),
  },
  { key: "switchingCosts", name: t("Switching costs", "Switching costs"), hint: t("ลูกค้าเสียเวลาหรือเงินถ้าเปลี่ยนไปเจ้าอื่น", "Customers lose time or money if they switch.") },
  { key: "branding", name: t("Branding", "Branding"), hint: t("ลูกค้ายอมจ่ายมากกว่าเพราะความเชื่อมั่นที่สะสมมานาน", "Customers pay more for trust built over a long time.") },
  {
    key: "corneredResource",
    name: t("Cornered resource", "Cornered resource"),
    hint: t("ทรัพยากรที่เราเข้าถึงได้คนเดียว เช่น สิทธิบัตร ทำเล สัญญา", "A resource only we can access: patents, locations, contracts."),
  },
  {
    key: "processPower",
    name: t("Process power", "Process power"),
    hint: t("วิธีทำงานที่สะสมจนคู่แข่งลอกไม่ได้แม้รู้ว่าทำอะไร", "Ways of working built up so rivals can't copy them even when they know what we do."),
  },
];

const powerFields = (p: (typeof POWERS)[number]): FieldDef[] => [
  { ...selectField(p.key, { th: `${p.name.th}: ระดับ`, en: `${p.name.en}: strength` }, POWER_LEVELS, p.hint), short: t("ระดับ", "Strength") },
  {
    ...textField(`${p.key}Evidence`, { th: `${p.name.th}: ทำไมคู่แข่งลอกไม่ได้`, en: `${p.name.en}: why rivals can't copy it` }),
    short: t("ทำไมคู่แข่งลอกไม่ได้", "Why rivals can't copy it"),
  },
];

const mainPower = textField(
  "mainPower",
  t("ความได้เปรียบที่ยั่งยืนที่สุด", "Our most durable advantage"),
  t("แยกให้ออกระหว่าง \"ทำได้ดี\" กับ \"คู่แข่งลอกไม่ได้\"", "Separate \"we do it well\" from \"rivals can't copy it\"."),
);

export const sevenPowers: StructuredDef = {
  key: "seven-powers",
  view: "canvas",
  steps: [
    { id: "early", title: t("ประเมิน 4 แหล่งแรก", "First 4 sources"), fields: POWERS.slice(0, 4).flatMap(powerFields) },
    { id: "late", title: t("ประเมิน 3 แหล่งหลัง", "Last 3 sources"), fields: POWERS.slice(4).flatMap(powerFields) },
    { id: "main", title: t("สรุป", "Verdict"), fields: [mainPower] },
  ],
  canvas: {
    boards: [
      {
        columns: 4,
        cards: true,
        areas: ["scale network counterPositioning switchingCosts", "branding corneredResource processPower mainPower"],
        cells: [
          ...POWERS.map((p) => ({ area: p.key, fields: [p.key, `${p.key}Evidence`], title: p.name })),
          { area: "mainPower", fields: ["mainPower"], tone: "accent" as const },
        ],
      },
    ],
  },
  example: {
    scale: "weak",
    network: "none",
    counterPositioning: "weak",
    counterPositioningEvidence: "delivery app ทำรอบส่งตายตัวไม่ได้ เพราะโมเดลรับทุกออเดอร์ทันที",
    switchingCosts: "weak",
    switchingCostsEvidence: "HR ต้องตั้งระบบสวัสดิการใหม่ถ้าเปลี่ยนเจ้า",
    branding: "none",
    corneredResource: "strong",
    corneredResourceEvidence: "สัญญาเช่าครัวกลางใจกลาง CBD 5 ปี คู่แข่งหาทำเลแบบนี้ไม่ได้",
    processPower: "weak",
    mainPower: "ทำเลครัวกลาง (cornered resource) บวกการวางแผนรอบส่งที่แม่นยำ",
  },
  checks(data: Data): Check[] {
    const checks: Check[] = [];
    for (const p of POWERS) {
      if (str(data, p.key) === "strong" && !str(data, `${p.key}Evidence`)) {
        checks.push({
          id: `no-evidence-${p.key}`,
          level: "warn",
          field: `${p.key}Evidence`,
          message: {
            th: `${p.name.th} ให้ระดับแข็งแต่ไม่มีหลักฐานว่าคู่แข่งลอกไม่ได้ (กับดักที่พบบ่อย: สับสน "ทำได้ดี" กับ "ลอกไม่ได้")`,
            en: `${p.name.en} is rated strong with no evidence rivals can't copy it (common trap: "do it well" vs "can't copy").`,
          },
        });
      }
    }
    const unrated = POWERS.filter((p) => !str(data, p.key));
    if (unrated.length) {
      checks.push({
        id: "unrated",
        level: "warn",
        field: unrated[0].key,
        message: {
          th: `ยังไม่ได้ประเมิน: ${unrated.map((p) => p.name.th).join(", ")}`,
          en: `Not assessed yet: ${unrated.map((p) => p.name.en).join(", ")}`,
        },
      });
    } else if (POWERS.every((p) => str(data, p.key) === "none")) {
      checks.push({
        id: "no-power",
        level: "warn",
        field: "mainPower",
        message: t("ยังไม่พบความได้เปรียบที่ยั่งยืน ลองดูว่าจะสร้างแหล่งไหนได้", "No lasting advantage found yet. Consider which one to build."),
      });
    }
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const strong = POWERS.filter((p) => str(data, p.key) === "strong").map((p) => p.name[lang]);
    const out = strong.length ? [`${lang === "th" ? "แข็ง" : "Strong"}: ${strong.join(", ")}`] : [];
    if (str(data, "mainPower")) out.push(str(data, "mainPower"));
    return out;
  },
};
