import type { Data, Lang, Stage } from "@/frameworks/types";
import type { ActionPlan, DecisionItem, ExecSummary } from "@/frameworks/summary";

export type Role = "admin" | "consultant";
export type ProjectStatus = "draft" | "waiting_client" | "analyzing" | "summarized";
export type AnalysisStatus = "not_started" | "in_progress" | "waiting_client" | "done";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  industry: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  stage: Stage;
  status: ProjectStatus;
  ai_enabled: boolean;
  report_lang: Lang;
  business_profile: Data;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  project_id: string;
  text: string;
  category: string | null;
  position: number;
  created_at: string;
}

export interface Analysis {
  id: string;
  project_id: string;
  question_id: string;
  framework_key: string;
  data: Data;
  status: AnalysisStatus;
  position: number;
  updated_at: string;
}

export interface Summary {
  project_id: string;
  exec_summary: ExecSummary;
  decisions: DecisionItem[];
  action_plan: ActionPlan;
  source: "ai" | "template" | "manual";
  updated_at: string;
}

export interface LinkScope {
  profile: string[];
  analyses: Record<string, string[]>;
}

export interface ClientLink {
  id: string;
  project_id: string;
  token: string;
  label: string | null;
  message: string | null;
  scope: LinkScope;
  expires_at: string | null;
  revoked_at: string | null;
  opened_at: string | null;
  submitted_at: string | null;
  created_at: string;
}

export interface ReportPublication {
  id: string;
  project_id: string;
  token: string;
  lang: Lang;
  published_at: string;
  revoked_at: string | null;
}

/** What a published report stores, so later edits don't change what the client saw. */
export interface ReportSnapshot {
  projectName: string;
  clientName: string;
  stage: Stage;
  summary: Pick<Summary, "exec_summary" | "decisions" | "action_plan"> | null;
  questions: { text: string; analyses: { framework_key: string; data: Data }[] }[];
}

/** What a client link returns. */
export interface ClientLinkView {
  project_name: string;
  client_name: string;
  lang: Lang;
  label: string | null;
  message: string | null;
  submitted_at: string | null;
  expires_at: string | null;
  profile_fields: string[];
  profile: Data;
  analyses: { id: string; framework_key: string; question: string; fields: string[]; data: Data }[];
}
