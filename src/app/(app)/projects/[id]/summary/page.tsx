import { emptySummary, type ProjectSummary } from "@/frameworks/summary";
import { getProject, getProjectContent, getSummary } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import { SummaryEditor } from "./summary-editor";

export default async function SummaryPage({ params }: PageProps<"/projects/[id]/summary">) {
  const { id } = await params;
  const { project } = await getProject(id);
  const { questions, analyses } = await getProjectContent(id);
  const summary = await getSummary(id);
  const { t } = await getT();

  const items = analyses.map((a) => ({
    question: questions.find((q) => q.id === a.question_id)?.text ?? "",
    frameworkKey: a.framework_key,
    data: a.data,
  }));
  const initial: ProjectSummary = summary
    ? { exec_summary: summary.exec_summary, decisions: summary.decisions, action_plan: summary.action_plan }
    : emptySummary();

  return (
    <div className="max-w-4xl">
      <h2 className="text-lg font-semibold">{t("summary.title")}</h2>
      <p className="mb-5 text-sm text-muted">{t("summary.intro")}</p>
      <SummaryEditor
        projectId={id}
        initial={initial}
        initialSource={summary?.source ?? null}
        items={items}
        aiEnabled={project.ai_enabled}
        reportLang={project.report_lang}
      />
    </div>
  );
}
