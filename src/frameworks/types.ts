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
  /** Shorter label used inside a titled canvas cell. */
  short?: L;
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

/** Colors that link related items across cells, e.g. a segment and its value proposition. */
export const TAG_COLORS = ["blue", "green", "amber", "rose", "violet", "teal"] as const;
export type TagColor = (typeof TAG_COLORS)[number];

/** One entry in a list field. Older data stores plain strings, which still read fine. */
export interface ListItem {
  id: string;
  text: string;
  tag?: TagColor;
}

export type CellTone = "neutral" | "accent" | "ok" | "warn" | "err";

export interface CanvasCell {
  area: string;
  fields: string[];
  title?: L;
  tone?: CellTone;
}

export interface CanvasBoard {
  title?: L;
  columns: number;
  /** CSS grid-template-areas rows, one string per row. */
  areas: string[];
  cells: CanvasCell[];
  /** Separate cards instead of one joined grid; "." areas stay empty. */
  cards?: boolean;
  /** Axis labels for 2×2 boards: x = [left, right], y = [top, bottom]. */
  axes?: { x: [L, L]; y: [L, L]; xTitle?: L; yTitle?: L };
}

export interface CanvasSpec {
  boards: CanvasBoard[];
  /** List field whose items name the link colors, e.g. customer segments. */
  linkAnchor?: string;
}

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
  /** Layout for the shared grid canvas view. */
  canvas?: CanvasSpec;
}
