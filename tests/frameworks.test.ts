import { describe, expect, it } from "vitest";
import { CATALOG, CATEGORIES } from "@/frameworks/catalog";
import { computeFunnel } from "@/frameworks/defs/aarrr";
import { computeUnitEconomics } from "@/frameworks/defs/unit-economics";
import { FRAMEWORKS, fieldsOf, getFramework, runChecks, stepsOf } from "@/frameworks/registry";
import { guessCategory, recommend } from "@/frameworks/recommend";
import { templateSummary } from "@/frameworks/summary";

const ids = (checks: { id: string }[]) => checks.map((c) => c.id);

describe("registry", () => {
  it("has all 35 frameworks from the cheat sheet in 8 categories", () => {
    expect(CATALOG).toHaveLength(35);
    expect(new Set(CATALOG.map((f) => f.key)).size).toBe(35);
    expect(CATEGORIES).toHaveLength(8);
    for (const f of CATALOG) expect(CATEGORIES.map((c) => c.key)).toContain(f.category);
  });

  it("structures the 7 most useful frameworks", () => {
    const structured = FRAMEWORKS.filter((f) => f.structured).map((f) => f.key).sort();
    expect(structured).toEqual(["aarrr", "bmc", "issue-tree", "jtbd", "okrs", "playing-to-win", "unit-economics"]);
    expect(FRAMEWORKS.filter((f) => f.topSeven).every((f) => f.structured)).toBe(true);
  });

  it("gives every framework unique field keys and bilingual text", () => {
    for (const f of FRAMEWORKS) {
      const keys = fieldsOf(f).map((x) => x.key);
      expect(new Set(keys).size, f.key).toBe(keys.length);
      for (const step of stepsOf(f)) {
        expect(step.title.th && step.title.en, `${f.key}/${step.id}`).toBeTruthy();
        for (const field of step.fields) expect(field.label.th && field.label.en, `${f.key}/${field.key}`).toBeTruthy();
      }
      expect(f.name.en && f.question.th && f.howTo.en && f.trap.th, f.key).toBeTruthy();
    }
  });

  it("only uses example keys that exist as fields", () => {
    for (const f of FRAMEWORKS.filter((x) => x.example)) {
      const keys = new Set(fieldsOf(f).map((x) => x.key));
      for (const k of Object.keys(f.example!)) expect(keys.has(k), `${f.key}.${k}`).toBe(true);
    }
  });

  it("runs checks on empty data without crashing", () => {
    for (const f of FRAMEWORKS) expect(() => runChecks(f, {})).not.toThrow();
  });
});

describe("unit economics", () => {
  const data = getFramework("unit-economics")!.example!;

  it("calculates LTV, CAC, ratio and payback", () => {
    const u = computeUnitEconomics(data);
    expect(u.contribution).toBeCloseTo(315); // 900 × 35%
    expect(u.lifetimeMonths).toBeCloseTo(10); // 1 ÷ 10%
    expect(u.ltv).toBeCloseTo(3150);
    expect(u.cac).toBeCloseTo(95000 / 75);
    expect(u.ratio).toBeCloseTo(3150 / (95000 / 75));
    expect(u.payback).toBeCloseTo(95000 / 75 / 315);
  });

  it("flags loss-making channels hidden in the average", () => {
    const checks = runChecks(getFramework("unit-economics")!, data);
    expect(ids(checks)).toContain("losing-LINE Ads");
    expect(checks.find((c) => c.id === "ratio")?.level).toBe("warn");
  });

  it("handles missing inputs", () => {
    const u = computeUnitEconomics({ arpu: 100 });
    expect(u.ltv).toBeNull();
    expect(u.ratio).toBeNull();
  });
});

describe("AARRR", () => {
  it("finds the leakiest stage, ignoring referral", () => {
    const { steps, leak } = computeFunnel(getFramework("aarrr")!.example!);
    expect(steps.find((s) => s.key === "activation")?.conversion).toBeCloseTo(0.4);
    expect(steps.find((s) => s.key === "retention")?.conversion).toBeCloseTo(0.25);
    expect(steps.find((s) => s.key === "revenue")?.conversion).toBeCloseTo(0.2);
    expect(leak).toBe("revenue");
  });

  it("warns when the fix pours money into acquisition", () => {
    const data = { ...getFramework("aarrr")!.example!, fixPlan: "เพิ่มงบยิงแอด Facebook" };
    expect(ids(runChecks(getFramework("aarrr")!, data))).toContain("acquisition-trap");
  });
});

describe("cheat sheet traps", () => {
  it("JTBD: catches feature answers and few interviews", () => {
    const checks = runChecks(getFramework("jtbd")!, {
      situation: "ตอนเช้า",
      motivation: "มีปุ่มสั่งซ้ำในแอพ",
      outcome: "สั่งได้เร็ว",
      interviews: 2,
    });
    expect(ids(checks)).toEqual(expect.arrayContaining(["feature-trap", "few-interviews"]));
  });

  it("OKRs: catches KRs without numbers and task-like KRs", () => {
    const checks = runChecks(getFramework("okrs")!, {
      objective: "โตแบบมีกำไร",
      keyResults: [
        { id: "1", text: "ทำแคมเปญ 11.11", target: null },
        { id: "2", text: "เพิ่มยอดขายเป็น 2 ล้าน", baseline: 1, target: 2, owner: "A" },
      ],
    });
    expect(ids(checks)).toEqual(expect.arrayContaining(["kr-no-number", "kr-task", "kr-owner"]));
  });

  it("Playing to Win: catches 'where to play' with nothing ruled out", () => {
    const checks = runChecks(getFramework("playing-to-win")!, { aspiration: "x", whereToPlay: ["ทุกคน"] });
    expect(ids(checks)).toContain("no-choice");
  });

  it("Issue tree: catches single children and duplicates", () => {
    const checks = runChecks(getFramework("issue-tree")!, {
      rootQuestion: "ทำไมยอดขายตก",
      tree: {
        id: "r",
        text: "ยอดขายตก",
        children: [
          { id: "a", text: "ลูกค้าน้อยลง", children: [{ id: "a1", text: "ใหม่", children: [] }] },
          { id: "b", text: "ลูกค้าน้อยลง", children: [] },
        ],
      },
    });
    expect(ids(checks)).toEqual(expect.arrayContaining(["single-child", "duplicates", "no-focus"]));
  });

  it("asks every framework for real data and a next step", () => {
    const checks = runChecks(getFramework("pestel")!, { analysis: "x" });
    expect(ids(checks)).toEqual(expect.arrayContaining(["no-sources", "no-conclusion", "no-next"]));
  });
});

describe("recommendations", () => {
  it("guesses the category from the question", () => {
    expect(guessCategory("ทำไมลูกค้าไม่กลับมาซื้อซ้ำ")).toMatch(/customer|growth/);
    expect(guessCategory("ลูกค้าแต่ละรายกำไรหรือขาดทุน cac สูงไหม")).toBe("model");
  });

  it("ranks the chosen category and stage first", () => {
    const recs = recommend("ลูกค้าแต่ละรายกำไรไหม", "sme", "model");
    expect(recs[0].framework.key).toBe("unit-economics");
    expect(recs.every((r) => r.framework.category === "model")).toBe(true);
    const startup = recommend("ไอเดียนี้มีคนต้องการไหม", "startup", "model");
    expect(startup[0].framework.key).toBe("lean-canvas");
  });
});

describe("template summary", () => {
  it("turns conclusions and next steps into a draft", () => {
    const summary = templateSummary(
      [
        {
          question: "ลูกค้ากำไรไหม",
          frameworkKey: "unit-economics",
          data: { ...getFramework("unit-economics")!.example!, _conclusion: "LINE Ads ขาดทุน", _next: "ทดสอบตัดงบ LINE Ads 1 เดือน" },
        },
        { question: "เป้าไตรมาส", frameworkKey: "okrs", data: { ...getFramework("okrs")!.example!, _next: "ประชุมทุกวันจันทร์" } },
      ],
      "th",
    );
    expect(summary.exec_summary.reasons[0].title).toBe("LINE Ads ขาดทุน");
    expect(summary.decisions.map((d) => d.kind)).toEqual(expect.arrayContaining(["hypothesis", "decision"]));
    expect(summary.action_plan.objective).toBe("ทำให้ลูกค้าออฟฟิศกลับมาสั่งทุกสัปดาห์");
    expect(summary.action_plan.keyResults).toHaveLength(3);
    expect(summary.action_plan.tasks.map((t) => t.task)).toContain("ประชุมทุกวันจันทร์");
  });
});
