import { ReportView } from "@/components/report-view";
import { Card } from "@/components/ui";
import { getProject, getProjectContent, getSummary, requireMember } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import type { ReportPublication, ReportSnapshot } from "@/lib/types";
import { ReportActions } from "./report-actions";

export default async function ReportPage({ params }: PageProps<"/projects/[id]/report">) {
  const { id } = await params;
  const { supabase } = await requireMember();
  const { project, client } = await getProject(id);
  const { questions, analyses } = await getProjectContent(id);
  const summary = await getSummary(id);
  const { t } = await getT();
  const { data: publications } = await supabase
    .from("report_publications")
    .select("id, project_id, token, lang, published_at, revoked_at")
    .eq("project_id", id)
    .order("published_at", { ascending: false });

  const snapshot: ReportSnapshot = {
    projectName: project.name,
    clientName: client.name,
    stage: project.stage,
    summary: summary ? { exec_summary: summary.exec_summary, decisions: summary.decisions, action_plan: summary.action_plan } : null,
    questions: questions.map((q) => ({
      text: q.text,
      analyses: analyses.filter((a) => a.question_id === q.id).map((a) => ({ framework_key: a.framework_key, data: a.data })),
    })),
  };
  const date = new Date().toLocaleDateString(project.report_lang === "th" ? "th-TH" : "en-US", { dateStyle: "long" });

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h2 className="text-lg font-semibold">{t("report.title")}</h2>
        <p className="mb-4 max-w-2xl text-sm text-muted">{t("report.intro")}</p>
        {!summary && <p className="mb-4 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">{t("report.noSummary")}</p>}
        <ReportActions projectId={id} publications={(publications ?? []) as ReportPublication[]} />
      </div>
      <div className="no-print text-xs font-semibold tracking-wide text-muted uppercase">{t("report.preview")}</div>
      <Card className="overflow-hidden print:border-0">
        <ReportView snapshot={snapshot} lang={project.report_lang} date={date} />
      </Card>
    </div>
  );
}
