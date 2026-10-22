import { cellNum, cellStr, num, rows, t } from "../helpers";
import type { Check, Data, Lang, Metric, StructuredDef } from "./types";

export interface ChannelResult {
  name: string;
  spend: number | null;
  customers: number | null;
  cac: number | null;
  ratio: number | null;
}

export interface UnitEconomics {
  contribution: number | null;
  lifetimeMonths: number | null;
  ltv: number | null;
  cac: number | null;
  ratio: number | null;
  payback: number | null;
  channels: ChannelResult[];
}

const div = (a: number | null, b: number | null) => (a != null && b != null && b !== 0 ? a / b : null);

export function computeUnitEconomics(data: Data): UnitEconomics {
  const arpu = num(data, "arpu");
  const margin = num(data, "grossMargin");
  const churn = num(data, "churn");
  const contribution = arpu != null && margin != null ? (arpu * margin) / 100 : null;
  const lifetimeMonths = churn != null && churn > 0 ? 100 / churn : null;
  const ltv = contribution != null && lifetimeMonths != null ? contribution * lifetimeMonths : null;

  const channels = rows(data, "channels").map((row) => {
    const spend = cellNum(row, "spend");
    const customers = cellNum(row, "customers");
    const cac = div(spend, customers);
    return { name: cellStr(row, "name"), spend, customers, cac, ratio: div(ltv, cac) };
  });
  const totalSpend = channels.reduce((s, c) => s + (c.spend ?? 0), 0);
  const totalCustomers = channels.reduce((s, c) => s + (c.customers ?? 0), 0);
  const cac = channels.length ? div(totalSpend, totalCustomers) : null;

  return {
    contribution,
    lifetimeMonths,
    ltv,
    cac,
    ratio: div(ltv, cac),
    payback: div(cac, contribution),
    channels,
  };
}

export const unitEconomics: StructuredDef = {
  key: "unit-economics",
  view: "calculator",
  steps: [
    {
      id: "scope",
      title: t("ขอบเขต", "Scope"),
      intro: t(
        "คำนวณแยกตามกลุ่มลูกค้าหรือสินค้า ค่าเฉลี่ยรวมมักซ่อนส่วนที่ขาดทุน",
        "Calculate per segment or product. Blended averages often hide what loses money.",
      ),
      fields: [
        {
          key: "segment",
          type: "text",
          label: t("กลุ่มลูกค้าหรือสินค้าที่คำนวณ", "Segment or product calculated"),
          example: t("ลูกค้าแพ็กเกจรายเดือน", "Monthly package customers"),
        },
        {
          key: "period",
          type: "text",
          label: t("ช่วงข้อมูล", "Data period"),
          example: t("ก.ค.–ก.ย. 2026", "Jul–Sep 2026"),
        },
      ],
    },
    {
      id: "revenue",
      title: t("รายได้ต่อลูกค้า", "Revenue per customer"),
      fields: [
        {
          key: "arpu",
          type: "number",
          label: t("รายได้เฉลี่ยต่อลูกค้าต่อเดือน", "Average revenue per customer per month"),
          unit: t("บาท", "THB"),
          hint: t(
            "ถ้าไม่ใช่ subscription ใช้ยอดซื้อเฉลี่ยต่อปี ÷ 12",
            "If it isn't a subscription, use average yearly spend ÷ 12.",
          ),
        },
        {
          key: "grossMargin",
          type: "number",
          label: t("กำไรส่วนเกิน (contribution margin)", "Contribution margin"),
          unit: t("%", "%"),
          hint: t(
            "รายได้ลบต้นทุนผันแปร (วัตถุดิบ ค่าส่ง ค่าธรรมเนียม) เป็น % ของรายได้",
            "Revenue minus variable costs (materials, delivery, fees) as a % of revenue.",
          ),
        },
        {
          key: "churn",
          type: "number",
          label: t("ลูกค้าเลิกซื้อต่อเดือน (churn)", "Monthly churn"),
          unit: t("%", "%"),
          hint: t(
            "% ของลูกค้าที่หายไปในแต่ละเดือน ใช้คำนวณอายุลูกค้า = 1 ÷ churn",
            "% of customers lost each month. Customer lifetime = 1 ÷ churn.",
          ),
        },
      ],
    },
    {
      id: "acquisition",
      title: t("ต้นทุนหาลูกค้าแยกช่องทาง", "Acquisition cost by channel"),
      intro: t(
        "ใส่ทุกช่องทางแยกกัน เพื่อเห็นช่องทางที่ขาดทุน",
        "Enter each channel separately so loss-making channels show up.",
      ),
      fields: [
        {
          key: "channels",
          type: "table",
          label: t("ช่องทาง", "Channels"),
          columns: [
            { key: "name", label: t("ช่องทาง", "Channel"), type: "text" },
            { key: "spend", label: t("ค่าใช้จ่าย (บาท)", "Spend (THB)"), type: "number" },
            { key: "customers", label: t("ลูกค้าใหม่ (ราย)", "New customers"), type: "number" },
          ],
        },
      ],
    },
  ],
  example: {
    segment: "ลูกค้าแพ็กเกจรายเดือน",
    period: "ก.ค.–ก.ย. 2026",
    arpu: 900,
    grossMargin: 35,
    churn: 10,
    channels: [
      { id: "a", name: "Facebook Ads", spend: 60000, customers: 40 },
      { id: "b", name: "HR บริษัท", spend: 15000, customers: 30 },
      { id: "c", name: "LINE Ads", spend: 20000, customers: 5 },
    ],
  },
  metrics(data: Data): Metric[] {
    const u = computeUnitEconomics(data);
    return [
      { key: "contribution", label: t("กำไรส่วนเกินต่อเดือน", "Monthly contribution"), value: u.contribution, format: "currency" },
      { key: "lifetime", label: t("อายุลูกค้าเฉลี่ย", "Average lifetime"), value: u.lifetimeMonths, format: "months" },
      { key: "ltv", label: t("LTV", "LTV"), value: u.ltv, format: "currency" },
      { key: "cac", label: t("CAC รวม", "Blended CAC"), value: u.cac, format: "currency" },
      {
        key: "ratio",
        label: t("LTV / CAC", "LTV / CAC"),
        value: u.ratio,
        format: "ratio",
        level: u.ratio == null ? undefined : u.ratio >= 3 ? "ok" : u.ratio >= 1 ? "warn" : "error",
      },
      {
        key: "payback",
        label: t("คืนทุนค่าหาลูกค้า", "CAC payback"),
        value: u.payback,
        format: "months",
        level: u.payback == null ? undefined : u.payback <= 12 ? "ok" : u.payback <= 18 ? "warn" : "error",
      },
    ];
  },
  checks(data: Data): Check[] {
    const u = computeUnitEconomics(data);
    const checks: Check[] = [];
    if (u.ltv == null) {
      checks.push({
        id: "missing-ltv-inputs",
        level: "error",
        field: "arpu",
        message: t("ต้องมีรายได้ต่อเดือน, % กำไรส่วนเกิน และ churn เพื่อคำนวณ LTV", "Monthly revenue, contribution margin and churn are needed for LTV."),
      });
    }
    if (u.channels.length === 0) {
      checks.push({
        id: "no-channels",
        level: "error",
        field: "channels",
        message: t("ยังไม่มีข้อมูลช่องทาง จึงคำนวณ CAC ไม่ได้", "No channel data, so CAC can't be calculated."),
      });
    } else if (u.channels.length === 1) {
      checks.push({
        id: "single-channel",
        level: "warn",
        field: "channels",
        message: t(
          "มีช่องทางเดียว ถ้าจริงๆ มีหลายช่องทาง ให้แยกใส่ เพราะค่าเฉลี่ยรวมซ่อนช่องทางที่ขาดทุน",
          "Only one channel. If there are more, split them: blended averages hide losing channels.",
        ),
      });
    }
    if (u.ratio != null) {
      checks.push(
        u.ratio >= 3
          ? { id: "ratio", level: "ok", message: { th: `LTV/CAC = ${u.ratio.toFixed(1)} ผ่านเกณฑ์ ≥ 3`, en: `LTV/CAC = ${u.ratio.toFixed(1)}, meets the ≥ 3 bar` } }
          : {
              id: "ratio",
              level: u.ratio >= 1 ? "warn" : "error",
              message: {
                th: `LTV/CAC = ${u.ratio.toFixed(1)} ต่ำกว่าเกณฑ์ทั่วไป 3`,
                en: `LTV/CAC = ${u.ratio.toFixed(1)}, below the common bar of 3`,
              },
            },
      );
    }
    if (u.payback != null && u.payback > 12) {
      checks.push({
        id: "payback",
        level: u.payback > 18 ? "error" : "warn",
        message: {
          th: `คืนทุนค่าหาลูกค้าใน ${u.payback.toFixed(1)} เดือน (เกณฑ์ทั่วไปไม่เกิน 12–18 เดือน)`,
          en: `CAC pays back in ${u.payback.toFixed(1)} months (common bar: 12–18 months)`,
        },
      });
    }
    for (const c of u.channels) {
      if (c.ratio != null && c.ratio < 1) {
        checks.push({
          id: `losing-${c.name}`,
          level: "error",
          field: "channels",
          message: {
            th: `ช่องทาง "${c.name}" ขาดทุน: LTV/CAC = ${c.ratio.toFixed(2)}`,
            en: `Channel "${c.name}" loses money: LTV/CAC = ${c.ratio.toFixed(2)}`,
          },
        });
      }
    }
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const u = computeUnitEconomics(data);
    const out: string[] = [];
    const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
    if (u.ltv != null && u.cac != null && u.ratio != null) {
      out.push(
        lang === "th"
          ? `LTV ${fmt(u.ltv)} บาท, CAC ${fmt(u.cac)} บาท, LTV/CAC = ${u.ratio.toFixed(1)}`
          : `LTV ${fmt(u.ltv)} THB, CAC ${fmt(u.cac)} THB, LTV/CAC = ${u.ratio.toFixed(1)}`,
      );
    }
    if (u.payback != null) {
      out.push(lang === "th" ? `คืนทุนค่าหาลูกค้าใน ${u.payback.toFixed(1)} เดือน` : `CAC payback in ${u.payback.toFixed(1)} months`);
    }
    const losing = u.channels.filter((c) => c.ratio != null && c.ratio < 1).map((c) => c.name);
    if (losing.length) out.push((lang === "th" ? "ช่องทางที่ขาดทุน: " : "Loss-making channels: ") + losing.join(", "));
    return out;
  },
};
