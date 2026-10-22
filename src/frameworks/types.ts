export type Lang = "th" | "en";
/** A piece of text in both UI languages. */
export type L = { th: string; en: string };

export type Stage = "startup" | "sme" | "enterprise";

export type CategoryKey =
  | "market"
  | "customer"
  | "model"
  | "strategy"
  | "innovation"
  | "growth"
  | "execution"
  | "thinking";

export type ViewKey =
  | "statement"
  | "canvas"
  | "calculator"
  | "cascade"
  | "funnel"
  | "okr"
  | "tree"
  | "generic";

export type ProfileKey =
  | "businessName"
  | "offering"
  | "targetCustomers"
  | "revenueModel"
  | "monthlyRevenue"
  | "teamSize"
  | "competitors"
  | "challenges"
  | "goals";

export interface Option {
  value: string;
  label: L;
}

export interface ColumnDef {
  key: string;
  label: L;
  type: "text" | "number" | "select";
  options?: Option[];
}

export type FieldType = "text" | "textarea" | "list" | "number" | "select" | "table" | "tree";

export interface FieldDef {
  key: string;
  type: FieldType;
  label: L;
  hint?: L;
  example?: L;
  placeholder?: L;
  unit?: L;
  options?: Option[];
  columns?: ColumnDef[];
  /** Suggest the value from the project's business profile when empty. */
  profileKey?: ProfileKey;
  /** Suggest the analysis question as the value when empty. */
  fromQuestion?: boolean;
}

export interface StepDef {
  id: string;
  title: L;
  intro?: L;
  fields: FieldDef[];
}

export type CheckLevel = "ok" | "warn" | "error";

export interface Check {
  id: string;
  level: CheckLevel;
  message: L;
  field?: string;
}

export type MetricFormat = "currency" | "percent" | "ratio" | "months" | "number";

export interface Metric {
  key: string;
  label: L;
  value: number | null;
  format: MetricFormat;
  level?: CheckLevel;
}

export type Data = Record<string, unknown>;

export type TableRow = { id: string } & Record<string, string | number | null>;

export interface TreeNode {
  id: string;
  text: string;
  children: TreeNode[];
}

/** What the cheat sheet says about a framework. */
export interface FrameworkMeta {
  key: string;
  category: CategoryKey;
  name: L;
  question: L;
  howTo: L;
  trap: L;
  /** Stages where the cheat sheet recommends it first. */
  stagePicks: Stage[];
  /** Stages where it is still useful. */
  stages: Stage[];
  /** Lower-case words that hint a business question fits this framework. */
  keywords: string[];
  topSeven?: boolean;
}

export interface FrameworkDef extends FrameworkMeta {
  view: ViewKey;
  /** False while the framework uses the general form (structured in Phase 2). */
  structured: boolean;
  steps: StepDef[];
  example?: Data;
  checks?: (data: Data) => Check[];
  metrics?: (data: Data) => Metric[];
  /** Short plain-language bullets for summaries when AI is off. */
  summarize?: (data: Data, lang: Lang) => string[];
  /** Extra settings for the shared views. */
  canvas?: { columns: number; areas: string[] };
}
