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

  it("structures the 7 most useful frameworks and the canvas group", () => {
    const structured = FRAMEWORKS.filter((f) => f.structured).map((f) => f.key).sort();
    expect(structured).toEqual(
      [
        "aarrr",
        "ansoff",
        "balanced-scorecard",
        "bcg",
        "blue-ocean",
        "bmc",
        "five-forces",
        "issue-tree",
        "jtbd",
        "lean-canvas",
        "marketing-mix",
        "mckinsey-7s",
        "okrs",
        "pestel",
        "playing-to-win",
        "seven-powers",
        "swot-tows",
        "unit-economics",
        "vpc",
      ].sort(),
    );
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

describe("canvas group traps", () => {
  const run = (key: string, data: Record<string, unknown>) => ids(runChecks(getFramework(key)!, data));

  it("passes the examples on their own traps", () => {
    for (const key of ["lean-canvas", "vpc", "swot-tows", "blue-ocean", "ansoff", "bcg", "pestel", "five-forces", "mckinsey-7s", "marketing-mix", "balanced-scorecard", "seven-powers", "bmc"]) {
      const def = getFramework(key)!;
      const errors = runChecks(def, def.example!).filter((c) => c.level === "error");
      expect(errors, key).toEqual([]);
    }
  });

  it("Lean Canvas: too many problems and a copyable advantage", () => {
    expect(run("lean-canvas", { problem: ["a", "b", "c", "d"], unfairAdvantage: ["ราคาถูกกว่า"] })).toEqual(
      expect.arrayContaining(["too-many-problems", "copyable-advantage"]),
    );
  });

  it("VPC: guessed customer side, pains without relievers, unmatched colors", () => {
    expect(run("vpc", { pains: [{ id: "p", text: "slow", tag: "rose" }], interviews: 1 })).toEqual(
      expect.arrayContaining(["few-interviews", "pains-without-relievers", "unmatched-p"]),
    );
    expect(run("vpc", { pains: [{ id: "p", text: "slow", tag: "rose" }], painRelievers: [{ id: "r", text: "fast", tag: "rose" }], interviews: 6 })).not.toContain(
      "unmatched-p",
    );
  });

  it("SWOT: stopping at the list", () => {
    expect(run("swot-tows", { strengths: ["x"] })).toContain("stopped-at-swot");
    expect(run("swot-tows", { strengths: ["x"], so: ["y"] })).not.toContain("stopped-at-swot");
  });

  it("ERRC: only adding", () => {
    expect(run("blue-ocean", { factors: ["price"], raise: ["speed"] })).toContain("only-adding");
  });

  it("Ansoff: diversifying before penetration", () => {
    expect(run("ansoff", { chosen: "diversification", reason: "x" })).toContain("diversify-first");
  });

  it("BCG: a single product", () => {
    expect(run("bcg", { stars: ["one"] })).toContain("single-unit");
  });

  it("PESTEL: no priorities, then too many", () => {
    expect(run("pestel", { economic: ["x"] })).toContain("no-priority");
    expect(run("pestel", { economic: ["x"], priority: ["a", "b", "c", "d"] })).toContain("too-many-priorities");
  });

  it("Five Forces: forgetting substitutes", () => {
    expect(run("five-forces", { rivalryLevel: "high" })).toEqual(expect.arrayContaining(["no-substitutes", "unrated"]));
  });

  it("7S: changing only the structure", () => {
    expect(run("mckinsey-7s", { strategy: ["x"], structure: ["y"] })).toContain("structure-only");
  });

  it("4P/7P: no positioning, missing service Ps", () => {
    expect(run("marketing-mix", { businessType: "service", product: ["x"] })).toEqual(expect.arrayContaining(["no-positioning", "service-ps"]));
  });

  it("Balanced Scorecard: too many metrics", () => {
    expect(run("balanced-scorecard", { financial: ["a", "b", "c", "d", "e"] })).toContain("too-many-metrics");
  });

  it("7 Powers: strong without evidence", () => {
    expect(run("seven-powers", { branding: "strong" })).toContain("no-evidence-branding");
  });

  it("BMC: a colored segment without a matching value proposition", () => {
    const data = { segments: [{ id: "s", text: "Offices", tag: "blue" }], valueProps: [{ id: "v", text: "Fast", tag: "blue" }] };
    expect(run("bmc", data)).toContain("unlinked-s");
    expect(run("bmc", { ...data, channels: [{ id: "c", text: "LINE", tag: "blue" }] })).not.toContain("unlinked-s");
  });
});
