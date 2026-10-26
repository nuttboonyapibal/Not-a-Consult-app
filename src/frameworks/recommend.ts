import { CATEGORIES } from "./catalog";
import { FRAMEWORKS } from "./registry";
import type { CategoryKey, FrameworkDef, L, Stage } from "./types";

export interface Recommendation {
  framework: FrameworkDef;
  score: number;
  reasons: L[];
}

function keywordHits(question: string, words: string[]) {
  const q = question.toLowerCase();
  return words.filter((w) => q.includes(w));
}

/** Guess the category from the question's words; null when nothing matches. */
export function guessCategory(question: string): CategoryKey | null {
  const scores = new Map<CategoryKey, number>();
  for (const f of FRAMEWORKS) {
    const hits = keywordHits(question, f.keywords).length;
    if (hits) scores.set(f.category, (scores.get(f.category) ?? 0) + hits);
  }
  let best: CategoryKey | null = null;
  let bestScore = 0;
  for (const c of CATEGORIES) {
    const s = scores.get(c.key) ?? 0;
    if (s > bestScore) {
      best = c.key;
      bestScore = s;
    }
  }
  return best;
}

/**
 * Rule-based recommendation used when AI is off: the chosen category first,
 * then fit with the business stage, then words in the question.
 */
export function recommend(question: string, stage: Stage, category: CategoryKey | null, limit = 3): Recommendation[] {
  const scored = FRAMEWORKS.map((framework) => {
    const reasons: L[] = [];
    let score = 0;
    if (category && framework.category === category) {
      score += 5;
      const cat = CATEGORIES.find((c) => c.key === category)!;
      reasons.push({ th: `ตอบคำถาม "${cat.question.th}"`, en: `Answers "${cat.question.en}"` });
    }
    if (framework.stagePicks.includes(stage)) {
      score += 3;
      reasons.push({ th: "cheat sheet แนะนำสำหรับระยะธุรกิจนี้", en: "Recommended for this business stage" });
    } else if (framework.stages.includes(stage)) {
      score += 1;
    } else {
      score -= 2;
    }
    const hits = keywordHits(question, framework.keywords);
    if (hits.length) {
      score += Math.min(hits.length, 3) * 2;
      reasons.push({ th: `คำถามพูดถึง "${hits.slice(0, 3).join(", ")}"`, en: `The question mentions "${hits.slice(0, 3).join(", ")}"` });
    }
    if (framework.topSeven) score += 0.5;
    if (framework.structured) score += 0.25;
    return { framework, score, reasons };
  });
  return scored
    .filter((r) => r.score > 0 && (category ? r.framework.category === category || r.score >= 6 : true))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
