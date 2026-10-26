import { containsAny, list, num, str, t } from "../helpers";
import type { Check, Data, Lang, StructuredDef } from "./types";

const FEATURE_WORDS = ["ฟีเจอร์", "feature", "แอพ", "แอป", "app", "ปุ่ม", "button", "ระบบ", "เมนู", "menu", "หน้าจอ"];

export const jtbd: StructuredDef = {
  key: "jtbd",
  view: "statement",
  steps: [
    {
      id: "context",
      title: t("ลูกค้าและสถานการณ์", "Customer and situation"),
      intro: t(
        "เริ่มจากคนจริงและช่วงเวลาจริงที่เขาต้องการความช่วยเหลือ ไม่ใช่จากสินค้าของเรา",
        "Start from a real person and the real moment they need help, not from our product.",
      ),
      fields: [
        {
          key: "customer",
          type: "text",
          label: t("ลูกค้าคือใคร", "Who is the customer"),
          profileKey: "targetCustomers",
          example: t("พนักงานออฟฟิศย่านสีลม อายุ 25–35", "Office workers in Silom, aged 25–35"),
        },
        {
          key: "situation",
          type: "textarea",
          label: t("เมื่อ… (สถานการณ์)", "When… (situation)"),
          hint: t(
            "ช่วงเวลา สถานที่ หรือเหตุการณ์ที่ทำให้ลูกค้าเริ่มมองหาทางออก",
            "The time, place or event that makes the customer start looking for a solution.",
          ),
          example: t("เมื่อต้องประชุมต่อเนื่องจนไม่มีเวลาออกไปกินข้าวเที่ยง", "When back-to-back meetings leave no time to go out for lunch"),
        },
      ],
    },
    {
      id: "job",
      title: t("งานที่ลูกค้าจ้างเรา", "The job"),
      intro: t(
        "เขียนเป็นความก้าวหน้าที่ลูกค้าต้องการ ไม่ใช่ฟีเจอร์ที่เราอยากขาย",
        "Write the progress the customer wants, not the feature we want to sell.",
      ),
      fields: [
        {
          key: "motivation",
          type: "textarea",
          label: t("ฉันอยากจะ… (แรงจูงใจ)", "I want to… (motivation)"),
          example: t("ได้กินอาหารที่อิ่มและไม่หนักท้องโดยไม่ต้องลุกจากโต๊ะ", "eat something filling but light without leaving my desk"),
        },
        {
          key: "outcome",
          type: "textarea",
          label: t("เพื่อที่จะ… (ผลลัพธ์)", "So I can… (outcome)"),
          example: t("มีแรงทำงานช่วงบ่ายและไม่รู้สึกผิดเรื่องสุขภาพ", "keep my energy up in the afternoon without feeling guilty about my health"),
        },
      ],
    },
    {
      id: "dimensions",
      title: t("มิติของงาน", "Dimensions of the job"),
      intro: t(
        "ลูกค้าจ้างสินค้าทั้งด้วยเหตุผลใช้งาน อารมณ์ และภาพลักษณ์ต่อคนอื่น",
        "Customers hire products for functional, emotional and social reasons.",
      ),
      fields: [
        {
          key: "functional",
          type: "textarea",
          label: t("ด้านการใช้งาน", "Functional"),
          example: t("ได้อาหารภายใน 15 นาที กินได้ด้วยมือเดียว", "Food within 15 minutes that can be eaten one-handed"),
        },
        {
          key: "emotional",
          type: "textarea",
          label: t("ด้านอารมณ์", "Emotional"),
          example: t("รู้สึกว่ายังดูแลตัวเองได้แม้งานยุ่ง", "Feeling I still take care of myself on busy days"),
        },
        {
          key: "social",
          type: "textarea",
          label: t("ด้านสังคม", "Social"),
          example: t("ไม่ดูเป็นคนกินขนมแทนข้าวต่อหน้าเพื่อนร่วมงาน", "Not looking like I skip real meals in front of colleagues"),
        },
      ],
    },
    {
      id: "evidence",
      title: t("ทางเลือกปัจจุบันและหลักฐาน", "Current alternatives and evidence"),
      fields: [
        {
          key: "alternatives",
          type: "list",
          label: t("ตอนนี้ลูกค้า \"จ้าง\" อะไรทำงานนี้อยู่", "What customers \"hire\" for this job today"),
          hint: t(
            "รวมทางเลือกที่ไม่ใช่คู่แข่งตรง เช่น ไม่กินเลย หรือกินขนมแทน",
            "Include non-obvious alternatives, like skipping the meal or eating snacks.",
          ),
          example: t("สั่ง delivery, ขนมปังจากร้านสะดวกซื้อ, ไม่กิน", "Delivery apps, convenience-store bread, skipping lunch"),
        },
        {
          key: "interviews",
          type: "number",
          label: t("คุยกับลูกค้าจริงกี่คน", "Customers interviewed"),
          unit: t("คน", "people"),
          hint: t("ควรคุยอย่างน้อย 5–10 คนก่อนสรุป job", "Talk to at least 5–10 people before settling on the job."),
        },
      ],
    },
  ],
  example: {
    customer: "พนักงานออฟฟิศย่านสีลม อายุ 25–35",
    situation: "เมื่อต้องประชุมต่อเนื่องจนไม่มีเวลาออกไปกินข้าวเที่ยง",
    motivation: "ได้กินอาหารที่อิ่มและไม่หนักท้องโดยไม่ต้องลุกจากโต๊ะ",
    outcome: "มีแรงทำงานช่วงบ่ายและไม่รู้สึกผิดเรื่องสุขภาพ",
    functional: "ได้อาหารภายใน 15 นาที กินได้ด้วยมือเดียว",
    emotional: "รู้สึกว่ายังดูแลตัวเองได้แม้งานยุ่ง",
    social: "ไม่ดูเป็นคนกินขนมแทนข้าว",
    alternatives: ["สั่ง delivery", "ขนมปังจากร้านสะดวกซื้อ", "ไม่กินเลย"],
    interviews: 8,
  },
  checks(data: Data): Check[] {
    const checks: Check[] = [];
    for (const key of ["situation", "motivation", "outcome"]) {
      if (!str(data, key)) {
        checks.push({
          id: `missing-${key}`,
          level: "error",
          field: key,
          message: t("ประโยค job ยังไม่ครบ 3 ส่วน (เมื่อ / อยากจะ / เพื่อที่จะ)", "The job statement needs all 3 parts (when / want to / so I can)."),
        });
        break;
      }
    }
    const jobText = `${str(data, "motivation")} ${str(data, "outcome")}`;
    if (jobText.trim() && containsAny(jobText, FEATURE_WORDS)) {
      checks.push({
        id: "feature-trap",
        level: "warn",
        field: "motivation",
        message: t(
          "ดูเหมือนตอบเป็นฟีเจอร์ ลองเขียนเป็นความก้าวหน้าที่ลูกค้าต้องการแทน",
          "This reads like a feature. Rewrite it as the progress the customer wants.",
        ),
      });
    }
    const interviews = num(data, "interviews");
    if (interviews == null || interviews < 5) {
      checks.push({
        id: "few-interviews",
        level: "warn",
        field: "interviews",
        message: t(
          "คุยกับลูกค้าน้อยกว่า 5 คน job ที่เขียนอาจมาจากการเดา",
          "Fewer than 5 customer interviews. The job may be a guess.",
        ),
      });
    }
    if (list(data, "alternatives").length === 0) {
      checks.push({
        id: "no-alternatives",
        level: "warn",
        field: "alternatives",
        message: t("ยังไม่ระบุว่าลูกค้าใช้อะไรแทนอยู่ตอนนี้", "Current alternatives are not listed."),
      });
    }
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const out: string[] = [];
    if (str(data, "situation") || str(data, "motivation")) {
      out.push(
        lang === "th"
          ? `เมื่อ ${str(data, "situation")} ลูกค้าอยากจะ ${str(data, "motivation")} เพื่อที่จะ ${str(data, "outcome")}`
          : `When ${str(data, "situation")}, the customer wants to ${str(data, "motivation")} so they can ${str(data, "outcome")}`,
      );
    }
    const alts = list(data, "alternatives");
    if (alts.length) out.push((lang === "th" ? "ทางเลือกที่ใช้อยู่: " : "Current alternatives: ") + alts.join(", "));
    return out;
  },
};
