import Link from "next/link";
import { ButtonLink, Card, cn } from "@/components/ui";
import { getT } from "@/lib/i18n/server";
import type { ProjectProgress, StepKey } from "@/lib/project-progress";

/** Five-step checklist at the top of the project page, with a button for the step to do next. */
export async function ProjectSteps({ projectId, progress }: { projectId: string; progress: ProjectProgress }) {
  const { t } = await getT();
  const base = `/projects/${projectId}`;
  const { profile, frameworks, client, summary, report } = progress;

  const steps: { key: StepKey; title: string; detail: string; href: string; done: boolean; optional?: boolean }[] = [
    {
      key: "profile",
      title: t("project.profile"),
      detail: `${profile.filled}/${profile.total} ${t("canvas.fields")}`,
      href: `${base}/profile`,
      done: profile.done,
    },
    {
      key: "frameworks",
      title: t("steps.frameworks"),
      detail: frameworks.total === 0 ? t("steps.noFrameworks") : `${t("steps.doneCount")} ${frameworks.done}/${frameworks.total}`,
      href: frameworks.firstOpen ? `${base}/analyses/${frameworks.firstOpen}` : `${base}/questions/new`,
      done: frameworks.complete,
    },
    {
      key: "client",
      title: t("project.links"),
      detail:
        client.submitted > 0
          ? t("links.submitted")
          : client.opened > 0
            ? t("links.opened")
            : client.active > 0
              ? t("astatus.waiting_client")
              : t("common.optional"),
      href: `${base}/links`,
      done: client.submitted > 0,
      optional: true,
    },
    {
      key: "summary",
      title: t("project.summary"),
      detail: summary.done ? t("steps.written") : t("astatus.not_started"),
      href: `${base}/summary`,
      done: summary.done,
    },
    {
      key: "report",
      title: t("project.report"),
      detail: report.outdated ? t("steps.outdated") : report.publishedAt ? t("report.published") : t("steps.notPublished"),
      href: `${base}/report`,
      done: report.done,
    },
  ];

  const next = steps.find((s) => s.key === progress.next);
  const nextLabel =
    next?.key === "frameworks" && frameworks.total === 0
      ? t("project.newQuestion")
      : next?.key === "report" && report.outdated
        ? t("report.publishAgain")
        : next?.title;

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">{t("steps.title")}</h2>
        {next ? (
          <ButtonLink href={next.href} size="sm">
            {t("steps.next")}: {nextLabel} →
          </ButtonLink>
        ) : (
          <span className="text-sm font-medium text-ok">✓ {t("steps.allDone")}</span>
        )}
      </div>
      <ol className="grid gap-2 sm:grid-cols-5">
        {steps.map((s, i) => {
          const isNext = s.key === progress.next;
          return (
            <li key={s.key}>
              <Link
                href={s.href}
                className={cn(
                  "flex h-full items-start gap-2.5 rounded-lg border p-3 transition-colors hover:bg-paper",
                  isNext ? "border-accent bg-accent-soft/40" : s.optional && !s.done ? "border-dashed border-line" : "border-line",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    s.done ? "bg-ok text-white" : isNext ? "bg-accent text-white" : "bg-black/5 text-muted",
                  )}
                >
                  {s.done ? "✓" : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{s.title}</span>
                  <span className={cn("block text-xs", s.key === "report" && report.outdated ? "text-warn" : "text-muted")}>{s.detail}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
