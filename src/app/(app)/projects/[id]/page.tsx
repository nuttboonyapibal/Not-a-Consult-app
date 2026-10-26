import Link from "next/link";
import { CATEGORIES } from "@/frameworks/catalog";
import { completion, getFramework } from "@/frameworks/registry";
import { AnalysisStatusBadge } from "@/components/status";
import { ButtonLink, Card, Empty, Progress } from "@/components/ui";
import { getProjectContent, getProjectProgress } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import { ProjectSteps } from "./project-steps";
import { QuestionMenu } from "./question-menu";

export default async function ProjectOverview({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const [{ questions, analyses }, progress] = await Promise.all([getProjectContent(id), getProjectProgress(id)]);
  const { t, tx } = await getT();

  return (
    <div className="space-y-6">
      <ProjectSteps projectId={id} progress={progress} />
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">{t("project.questions")}</h2>
          <ButtonLink href={`/projects/${id}/questions/new`} size="sm">
            + {t("project.newQuestion")}
          </ButtonLink>
        </div>
        {questions.length === 0 ? (
          <Empty>{t("project.noQuestions")}</Empty>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => {
              const category = CATEGORIES.find((c) => c.key === q.category);
              const items = analyses.filter((a) => a.question_id === q.id);
              return (
                <Card key={q.id} className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {category && <div className="mb-0.5 text-xs text-muted">{tx(category.name)}</div>}
                      <h3 className="font-semibold">{q.text}</h3>
                    </div>
                    <QuestionMenu projectId={id} questionId={q.id} existing={items.map((a) => a.framework_key)} />
                  </div>
                  <div className="space-y-2">
                    {items.map((a) => {
                      const def = getFramework(a.framework_key);
                      if (!def) return null;
                      const pct = completion(def, a.data);
                      return (
                        <Link
                          key={a.id}
                          href={`/projects/${id}/analyses/${a.id}`}
                          className="flex items-center gap-4 rounded-lg border border-line px-4 py-3 transition-colors hover:border-accent/40 hover:bg-paper"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">{tx(def.name)}</div>
                            <div className="truncate text-xs text-muted">{tx(def.question)}</div>
                          </div>
                          <div className="hidden w-28 sm:block">
                            <Progress value={pct} />
                            <div className="mt-1 text-right text-xs text-muted">{Math.round(pct * 100)}%</div>
                          </div>
                          <AnalysisStatusBadge status={a.status} />
                        </Link>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
