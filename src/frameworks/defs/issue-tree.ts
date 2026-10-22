import { list, str, t, tree, walkTree } from "../helpers";
import type { Check, Data, Lang, StructuredDef, TreeNode } from "./types";

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export const issueTree: StructuredDef = {
  key: "issue-tree",
  view: "tree",
  steps: [
    {
      id: "root",
      title: t("คำถามหลัก", "Key question"),
      intro: t(
        "เขียนเป็นคำถามเดียวที่ชัด เฉพาะเจาะจง และมีกรอบเวลา",
        "Write one clear, specific question with a time frame.",
      ),
      fields: [
        {
          key: "rootQuestion",
          type: "textarea",
          label: t("คำถามที่ต้องตอบ", "The question to answer"),
          fromQuestion: true,
          example: t(
            "ทำไมยอดขายสาขาสีลมลดลง 20% ในไตรมาส 3",
            "Why did Silom branch sales drop 20% in Q3?",
          ),
        },
      ],
    },
    {
      id: "branches",
      title: t("แตกกิ่ง (MECE)", "Branches (MECE)"),
      intro: t(
        "แต่ละระดับต้องไม่ซ้ำกันและครอบคลุมครบ เช่น ยอดขาย = จำนวนลูกค้า × ยอดต่อบิล",
        "Each level must not overlap and must cover everything, e.g. sales = customers × spend per bill.",
      ),
      fields: [
        {
          key: "tree",
          type: "tree",
          label: t("ต้นไม้ปัญหา", "Issue tree"),
          hint: t(
            "แตกได้ 3 ระดับ แต่ละกิ่งควรมี 2–5 กิ่งย่อย ทำเครื่องหมายกิ่งที่สำคัญเพื่อวิเคราะห์ต่อ",
            "Up to 3 levels, 2–5 children per branch. Mark the branches that matter for follow-up.",
          ),
        },
      ],
    },
    {
      id: "prune",
      title: t("ตัดกิ่ง", "Prune"),
      fields: [
        {
          key: "focusBranches",
          type: "list",
          label: t("กิ่งที่จะวิเคราะห์ต่อ และข้อมูลที่ต้องใช้", "Branches to analyse next, and the data needed"),
          example: t(
            "จำนวนลูกค้าใหม่ลดลง → ดูยอด walk-in รายสัปดาห์เทียบปีก่อน",
            "Fewer new customers → compare weekly walk-ins with last year",
          ),
        },
        {
          key: "cutBranches",
          type: "list",
          label: t("กิ่งที่ตัดทิ้ง และเหตุผล", "Branches cut, and why"),
        },
      ],
    },
  ],
  example: {
    rootQuestion: "ทำไมยอดขายสาขาสีลมลดลง 20% ในไตรมาส 3",
    tree: {
      id: "root",
      text: "ยอดขายลดลง 20%",
      children: [
        {
          id: "a",
          text: "จำนวนบิลลดลง",
          children: [
            { id: "a1", text: "ลูกค้าใหม่ลดลง", children: [] },
            { id: "a2", text: "ลูกค้าเก่ามาน้อยลง", children: [] },
          ],
        },
        {
          id: "b",
          text: "ยอดต่อบิลลดลง",
          children: [
            { id: "b1", text: "ซื้อจำนวนชิ้นน้อยลง", children: [] },
            { id: "b2", text: "ราคาเฉลี่ยต่อชิ้นลดลง", children: [] },
          ],
        },
      ],
    },
    focusBranches: ["ลูกค้าเก่ามาน้อยลง → ดูความถี่การซื้อของสมาชิก"],
    cutBranches: ["ราคาเฉลี่ยต่อชิ้นลดลง → ไม่ได้ปรับราคาและสัดส่วนสินค้าคงที่"],
  },
  checks(data: Data): Check[] {
    const checks: Check[] = [];
    const root = str(data, "rootQuestion");
    if (!root) {
      checks.push({ id: "no-root", level: "error", field: "rootQuestion", message: t("ยังไม่มีคำถามหลัก", "No key question yet.") });
    } else if (!/[?？]|ทำไม|อย่างไร|อะไร|ไหม|เท่าไร|how|why|what|which|should/i.test(root)) {
      checks.push({
        id: "root-not-question",
        level: "warn",
        field: "rootQuestion",
        message: t("คำถามหลักควรเขียนเป็นคำถาม", "The key question should be phrased as a question."),
      });
    }
    const node = tree(data, "tree");
    if (!node || node.children.length === 0) {
      checks.push({ id: "no-branches", level: "error", field: "tree", message: t("ยังไม่ได้แตกกิ่ง", "No branches yet.") });
      return checks;
    }
    const singles: TreeNode[] = [];
    const crowded: TreeNode[] = [];
    const dupes: string[] = [];
    walkTree(node, (n) => {
      if (n.children.length === 1) singles.push(n);
      if (n.children.length > 5) crowded.push(n);
      const seen = new Set<string>();
      for (const c of n.children) {
        const key = norm(c.text);
        if (key && seen.has(key)) dupes.push(c.text);
        seen.add(key);
      }
    });
    if (singles.length) {
      checks.push({
        id: "single-child",
        level: "warn",
        field: "tree",
        message: {
          th: `"${singles[0].text || "…"}" มีกิ่งย่อยเดียว แตกไม่ครบ (ไม่ใช่ MECE)`,
          en: `"${singles[0].text || "…"}" has a single child, so it isn't exhaustive (not MECE).`,
        },
      });
    }
    if (crowded.length) {
      checks.push({
        id: "crowded",
        level: "warn",
        field: "tree",
        message: {
          th: `"${crowded[0].text || "…"}" มีกิ่งย่อยมากกว่า 5 ลองจัดกลุ่มใหม่`,
          en: `"${crowded[0].text || "…"}" has more than 5 children. Try regrouping.`,
        },
      });
    }
    if (dupes.length) {
      checks.push({
        id: "duplicates",
        level: "warn",
        field: "tree",
        message: {
          th: `กิ่งซ้ำกัน: "${dupes[0]}" (กิ่งต้องไม่ซ้อนทับกัน)`,
          en: `Duplicate branch: "${dupes[0]}" (branches must not overlap).`,
        },
      });
    }
    if (list(data, "focusBranches").length === 0) {
      checks.push({
        id: "no-focus",
        level: "warn",
        field: "focusBranches",
        message: t("ยังไม่ได้เลือกกิ่งที่สำคัญ และตัดกิ่งที่ไม่สำคัญ", "No branches chosen to focus on or cut yet."),
      });
    }
    return checks;
  },
  summarize(data: Data, lang: Lang) {
    const out: string[] = [];
    const node = tree(data, "tree");
    if (node?.children.length) {
      out.push((lang === "th" ? "แตกเป็น: " : "Broken into: ") + node.children.map((c) => c.text).filter(Boolean).join(" / "));
    }
    const focus = list(data, "focusBranches");
    if (focus.length) out.push((lang === "th" ? "โฟกัส: " : "Focus: ") + focus.join("; "));
    return out;
  },
};
