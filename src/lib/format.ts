import type { Lang, MetricFormat } from "@/frameworks/types";

export function formatMetric(value: number | null, format: MetricFormat, lang: Lang): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const n = (v: number, digits = 0) =>
    v.toLocaleString(lang === "th" ? "th-TH" : "en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
  switch (format) {
    case "currency":
      return lang === "th" ? `${n(value)} บาท` : `${n(value)} THB`;
    case "percent":
      return `${n(value, value < 10 ? 1 : 0)}%`;
    case "ratio":
      return `${n(value, 1)}×`;
    case "months":
      return lang === "th" ? `${n(value, 1)} เดือน` : `${n(value, 1)} months`;
    default:
      return n(value, value % 1 === 0 ? 0 : 1);
  }
}
