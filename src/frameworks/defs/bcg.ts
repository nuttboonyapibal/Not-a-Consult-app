import { list, str, t } from "../helpers";
import { emptyWarnings, items, listField, listSummary, textField } from "./fields";
import type { Check, Data, Lang, StructuredDef } from "./types";

const UNITS = [
  listField("stars", t("Stars", "Stars"), t("ตลาดโตเร็ว ส่วนแบ่งสูง: ลงทุนต่อเพื่อรักษาตำแหน่ง", "High growth, high share: keep investing.")),
  listField("questionMarks", t("Question Marks", "Question Marks"), t("ตลาดโตเร็ว ส่วนแบ่งต่ำ: ตัดสินใจว่าจะลงทุนหรือถอย", "High growth, low share: invest or exit.")),
  listField("cashCows", t("Cash Cows", "Cash Cows"), t("ตลาดโตช้า ส่วนแบ่งสูง: เก็บเงินสดไปลงที่อื่น", "Low growth, high share: harvest cash for elsewhere.")),
  listField("dogs", t("Dogs", "Dogs"), t("ตลาดโตช้า ส่วนแบ่งต่ำ: พิจารณาเลิกหรือขาย", "Low growth, low share: consider closing or selling.")),
];

const allocation = textField(
  "allocation",
  t("การจัดสรรทรัพยากร", "Resource allocation"),
  t("เงินและคนจะย้ายจากไหนไปไหน", "Where money and people move from and to."),
);

export const bcg: StructuredDef = {
  key: "bcg",
  view: "canvas",
  steps: [
    { id: "units", title: t("วางหน่วยธุรกิจ", "Place the business units"), intro: t("ใช้เมื่อมีหลายธุรกิจหรือหลายสายสินค้า", "Use it when there are several businesses or product lines."), fields: UNITS },
    { id: "allocation", title: t("จัดสรร", "Allocate"), fields: [allocation] },
  ],
  canvas: {
    boards: [
      {
        columns: 2,
        areas: ["stars questionMarks", "cashCows dogs"],
        cells: [
          { area: "stars", fields: ["stars"], tone: "ok" },
          { area: "questionMarks", fields: ["questionMarks"], tone: "warn" },
          { area: "cashCows", fields: ["cashCows"], tone: "accent" },
          { area: "dogs", fields: ["dogs"], tone: "err" },
        ],
        axes: {
          x: [t("ส่วนแบ่งตลาดสูง", "High market share"), t("ส่วนแบ่งตลาดต่ำ", "Low market share")],
          y: [t("ตลาดโตเร็ว", "High growth"), t("ตลาดโตช้า", "Low growth")],
        },
      },
      { columns: 1, areas: ["allocation"], cells: [{ area: "allocation", fields: ["allocation"] }] },
    ],
  },
  example: {
    stars: items("แพ็กเกจองค์กร"),
    questionMarks: items("อาหารเย็นแช่แข็ง"),
    cashCows: items("ข้าวกล่องรายมื้อ"),
    dogs: items("สมูทตี้"),
    allocation: "ลงคนและงบการตลาดกับแพ็กเกจองค์กร ใช้เงินจากรายมื้อ ทดลองอาหารเย็นแบบจำกัด และหยุดสมูทตี้",
  },
  checks(data: Data): Check[] {
    const checks: Check[] = [];
    const total = UNITS.reduce((n, f) => n + list(data, f.key).length, 0);
    if (total < 2) {
      checks.push({
        id: "single-unit",
        level: "warn",
        field: "stars",
        message: t(
          "มีหน่วยธุรกิจน้อยกว่า 2 ตัว BCG ไม่มีประโยชน์กับธุรกิจที่มีสินค้าตัวเดียว (กับดักที่พบบ่อย)",
          "Fewer than 2 business units. BCG adds nothing for a single-product business (common trap).",
        ),
      });
    }
    if (total >= 2 && !str(data, "allocation")) checks.push(...emptyWarnings(data, [allocation], "no-allocation"));
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const out = listSummary(data, UNITS, lang, 2);
    if (str(data, "allocation")) out.push(str(data, "allocation"));
    return out;
  },
};
