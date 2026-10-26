import Link from "next/link";
import { CATEGORIES } from "@/frameworks/catalog";
import { PROFILE_FIELDS } from "@/frameworks/profile";
import { completion, getFramework } from "@/frameworks/registry";
import { isFilled } from "@/frameworks/helpers";
import { AnalysisStatusBadge } from "@/components/status";
import { ButtonLink, Card, Empty, Progress } from "@/components/ui";
import { getProject, getProjectContent } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import { QuestionMenu } from "./question-menu";

export default async function ProjectOverview({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const { project } = await getProject(id);
  const { questions, analyses } = await getProjectContent(id);
  const { t, tx } = await getT();
  const profileDone = PROFILE_FIELDS.filter((f) => isFilled(project.business_profile[f.key])).length / PROFILE_FIELDS.length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
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
      <aside className="space-y-4">
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">{t("project.profile")}</h2>
            <span className="text-sm text-muted">{Math.round(profileDone * 100)}%</span>
          </div>
          <Progress value={profileDone} />
          <p className="mt-3 text-xs leading-relaxed text-muted">{t("profile.intro")}</p>
          <ButtonLink href={`/projects/${id}/profile`} variant="secondary" size="sm" className="mt-3 w-full">
            {t("common.edit")}
          </ButtonLink>
        </Card>
        <Card className="p-5">
          <h2 className="mb-2 font-semibold">{t("project.links")}</h2>
          <p className="text-xs leading-relaxed text-muted">{t("links.intro")}</p>
          <ButtonLink href={`/projects/${id}/links`} variant="secondary" size="sm" className="mt-3 w-full">
            {t("links.new")}
          </ButtonLink>
        </Card>
      </aside>
    </div>
  );
}
