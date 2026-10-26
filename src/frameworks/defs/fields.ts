import { list, str, t } from "../helpers";
import type { Check, Data, FieldDef, L, Option } from "../types";

// Small builders shared by the canvas frameworks.

export const listField = (key: string, label: L, hint?: L, example?: L, extra: Partial<FieldDef> = {}): FieldDef => ({
  key,
  type: "list",
  label,
  hint,
  example,
  ...extra,
});

export const textField = (key: string, label: L, hint?: L, example?: L, extra: Partial<FieldDef> = {}): FieldDef => ({
  key,
  type: "textarea",
  label,
  hint,
  example,
  ...extra,
});

export const selectField = (key: string, label: L, options: Option[], hint?: L): FieldDef => ({
  key,
  type: "select",
  label,
  options,
  hint,
});

export const LEVELS: Option[] = [
  { value: "low", label: t("ต่ำ", "Low") },
  { value: "medium", label: t("กลาง", "Medium") },
  { value: "high", label: t("สูง", "High") },
];

export const POWER_LEVELS: Option[] = [
  { value: "none", label: t("ไม่มี", "None") },
  { value: "weak", label: t("อ่อน", "Weak") },
  { value: "strong", label: t("แข็ง", "Strong") },
];

/** A warning for each listed field that is still empty. */
export function emptyWarnings(data: Data, fields: FieldDef[], id = "empty"): Check[] {
  const empty = fields.filter((f) => (f.type === "list" ? list(data, f.key).length === 0 : !str(data, f.key)));
  if (empty.length === 0) return [];
  return [
    {
      id,
      level: "warn",
      field: empty[0].key,
      message: {
        th: `ยังว่าง: ${empty.map((f) => f.label.th).join(", ")}`,
        en: `Still empty: ${empty.map((f) => f.label.en).join(", ")}`,
      },
    },
  ];
}

/** Short summary bullets: "Label: first items". */
export function listSummary(data: Data, fields: FieldDef[], lang: "th" | "en", max = 2): string[] {
  return fields
    .map((f) => ({ f, items: list(data, f.key) }))
    .filter((x) => x.items.length > 0)
    .map(({ f, items }) => `${f.label[lang]}: ${items.slice(0, max).join(", ")}`);
}

/** Builds stable example items with ids and optional colors. */
export const items = (...entries: (string | [string, string])[]) =>
  entries.map((e, i) => (typeof e === "string" ? { id: `ex${i}`, text: e } : { id: `ex${i}`, text: e[0], tag: e[1] }));
