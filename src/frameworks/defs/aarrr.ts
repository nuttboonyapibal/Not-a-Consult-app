import { containsAny, num, str, t } from "../helpers";
import type { Check, Data, L, Lang, Metric, StructuredDef } from "./types";

export const AARRR_STAGES: { key: string; name: L; question: L; example: L }[] = [
  {
    key: "acquisition",
    name: t("Acquisition", "Acquisition"),
    question: t("คนรู้จักและเข้ามาหาเรา", "People find and visit us"),
    example: t("คนแอด LINE OA", "People adding the LINE OA"),
  },
  {
    key: "activation",
    name: t("Activation", "Activation"),
    question: t("ได้ประสบการณ์ดีครั้งแรก", "Get a good first experience"),
    example: t("สั่งมื้อแรก", "Order a first meal"),
  },
  {
    key: "retention",
    name: t("Retention", "Retention"),
    question: t("กลับมาใช้ซ้ำ", "Come back again"),
    example: t("สั่งซ้ำภายใน 30 วัน", "Reorder within 30 days"),
  },
  {
    key: "referral",
    name: t("Referral", "Referral"),
    question: t("บอกต่อ", "Tell others"),
    example: t("แนะนำเพื่อนที่มาสั่งจริง", "Refer a friend who orders"),
  },
  {
    key: "revenue",
    name: t("Revenue", "Revenue"),
    question: t("จ่ายเงินในระดับที่ทำให้ธุรกิจอยู่ได้", "Pay enough to sustain the business"),
    example: t("สมัครแพ็กเกจรายเดือน", "Buy a monthly package"),
  },
];

export interface FunnelStep {
  key: string;
  count: number | null;
  /** Share of the base stage that reached this one. */
  conversion: number | null;
}

// Referral and revenue are measured against retained customers. Referral is
// shown but not treated as the leak, since most customers never refer anyone.
const BASE: Record<string, string> = {
  activation: "acquisition",
  retention: "activation",
  referral: "retention",
  revenue: "retention",
};

export function computeFunnel(data: Data): { steps: FunnelStep[]; leak: string | null } {
  const steps: FunnelStep[] = AARRR_STAGES.map((s) => {
    const count = num(data, `${s.key}Count`);
    const base = BASE[s.key] ? num(data, `${BASE[s.key]}Count`) : null;
    return {
      key: s.key,
      count,
      conversion: count != null && base != null && base > 0 ? count / base : null,
    };
  });
  let leak: string | null = null;
  let worst = Infinity;
  for (const s of steps) {
    if (s.key !== "referral" && s.conversion != null && s.conversion < worst) {
      worst = s.conversion;
      leak = s.key;
    }
  }
  return { steps, leak };
}

const ACQUISITION_WORDS = ["โฆษณา", "ads", "ยิงแอด", "acquisition", "หาลูกค้าใหม่", "เพิ่มงบ", "boost", "influencer"];

export const aarrr: StructuredDef = {
  key: "aarrr",
  view: "funnel",
  steps: [
    {
      id: "define",
      title: t("นิยามแต่ละขั้น", "Define each stage"),
      intro: t(
        "ระบุว่าอะไรนับเป็นแต่ละขั้นในธุรกิจนี้ ต้องเป็นสิ่งที่นับได้จริง",
        "Say what counts as each stage in this business. It must be countable.",
      ),
      fields: AARRR_STAGES.map((s) => ({
        key: `${s.key}Def`,
        type: "text" as const,
        label: { th: `${s.name.th}: ${s.question.th}`, en: `${s.name.en}: ${s.question.en}` },
        example: s.example,
      })),
    },
    {
      id: "numbers",
      title: t("ตัวเลขจริง", "Real numbers"),
      intro: t("ใช้ช่วงเวลาเดียวกันทุกขั้น", "Use the same period for every stage."),
      fields: [
        {
          key: "period",
          type: "text",
          label: t("ช่วงเวลา", "Period"),
          example: t("ก.ย. 2026", "Sep 2026"),
        },
        ...AARRR_STAGES.map((s) => ({
          key: `${s.key}Count`,
          type: "number" as const,
          label: { th: `${s.name.th} (จำนวน)`, en: `${s.name.en} (count)` },
          unit: t("ราย", "people"),
        })),
      ],
    },
    {
      id: "fix",
      title: t("จุดรั่วและสิ่งที่จะแก้", "The leak and the fix"),
      intro: t(
        "แก้ขั้นที่รั่วมากที่สุดก่อน อย่าเทงบ acquisition ถ้า retention ยังรั่ว",
        "Fix the leakiest stage first. Don't pour money into acquisition while retention leaks.",
      ),
      fields: [
        {
          key: "leakCause",
          type: "textarea",
          label: t("ทำไมขั้นนี้ถึงรั่ว", "Why this stage leaks"),
        },
        {
          key: "fixPlan",
          type: "textarea",
          label: t("สิ่งที่จะลองแก้ และตัวเลขที่จะวัด", "What we'll try, and the number we'll measure"),
          example: t(
            "ส่ง LINE เตือนเมนูใหม่วันจันทร์ ตั้งเป้า retention จาก 25% เป็น 35% ใน 6 สัปดาห์",
            "Monday LINE reminder with the new menu, aiming to lift retention from 25% to 35% in 6 weeks",
          ),
        },
      ],
    },
  ],
  example: {
    acquisitionDef: "คนแอด LINE OA",
    activationDef: "สั่งมื้อแรก",
    retentionDef: "สั่งซ้ำภายใน 30 วัน",
    referralDef: "แนะนำเพื่อนที่มาสั่งจริง",
    revenueDef: "สมัครแพ็กเกจรายเดือน",
    period: "ก.ย. 2026",
    acquisitionCount: 1200,
    activationCount: 480,
    retentionCount: 120,
    referralCount: 30,
    revenueCount: 24,
  },
  metrics(data: Data): Metric[] {
    const { steps, leak } = computeFunnel(data);
    return steps.slice(1).map((s) => {
      const stage = AARRR_STAGES.find((x) => x.key === s.key)!;
      return {
        key: s.key,
        label: stage.name,
        value: s.conversion == null ? null : s.conversion * 100,
        format: "percent" as const,
        level: s.key === leak ? ("error" as const) : undefined,
      };
    });
  },
  checks(data: Data): Check[] {
    const { steps, leak } = computeFunnel(data);
    const checks: Check[] = [];
    const missing = steps.filter((s) => s.count == null);
    if (missing.length) {
      checks.push({
        id: "missing-counts",
        level: missing.length > 2 ? "error" : "warn",
        field: `${missing[0].key}Count`,
        message: t("ยังขาดตัวเลขบางขั้น จึงหาจุดรั่วได้ไม่ครบ", "Some stage counts are missing, so the leak may be wrong."),
      });
    }
    for (const s of steps) {
      if (s.conversion != null && s.conversion > 1) {
        checks.push({
          id: `over-100-${s.key}`,
          level: "warn",
          field: `${s.key}Count`,
          message: t(
            "ขั้นถัดไปมีจำนวนมากกว่าขั้นก่อนหน้า ตรวจนิยามหรือช่วงเวลาอีกครั้ง",
            "A later stage is larger than the one before it. Check the definitions or period.",
          ),
        });
        break;
      }
    }
    if (leak) {
      const stage = AARRR_STAGES.find((x) => x.key === leak)!;
      const conv = steps.find((s) => s.key === leak)!.conversion!;
      checks.push({
        id: "leak",
        level: "ok",
        message: {
          th: `จุดรั่วมากที่สุด: ${stage.name.th} (${(conv * 100).toFixed(0)}% ไปต่อ)`,
          en: `Biggest leak: ${stage.name.en} (${(conv * 100).toFixed(0)}% continue)`,
        },
      });
      const plan = str(data, "fixPlan");
      if (leak !== "activation" && plan && containsAny(plan, ACQUISITION_WORDS)) {
        checks.push({
          id: "acquisition-trap",
          level: "warn",
          field: "fixPlan",
          message: t(
            "แผนแก้เน้นหาลูกค้าใหม่ ทั้งที่จุดรั่วอยู่หลัง acquisition (กับดักที่พบบ่อย)",
            "The plan focuses on new customers while the leak is after acquisition (common trap).",
          ),
        });
      }
    }
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const { steps, leak } = computeFunnel(data);
    const out: string[] = [];
    const conv = steps
      .slice(1)
      .filter((s) => s.conversion != null)
      .map((s) => `${AARRR_STAGES.find((x) => x.key === s.key)!.name[lang]} ${(s.conversion! * 100).toFixed(0)}%`);
    if (conv.length) out.push(conv.join(" → "));
    if (leak) {
      const name = AARRR_STAGES.find((x) => x.key === leak)!.name[lang];
      out.push(lang === "th" ? `จุดรั่วมากที่สุดคือ ${name}` : `The biggest leak is ${name}`);
    }
    return out;
  },
};
