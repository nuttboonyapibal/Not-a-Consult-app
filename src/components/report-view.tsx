"use client";

import { STAGES } from "@/frameworks/catalog";
import { getFramework } from "@/frameworks/registry";
import type { Lang } from "@/frameworks/types";
import { UI } from "@/lib/i18n/ui";
import type { ReportSnapshot } from "@/lib/types";
import { FrameworkView } from "./views/framework-view";

/** The client-facing report. Uses the report's own language, not the viewer's. */
export function ReportView({ snapshot, lang, date }: { snapshot: ReportSnapshot; lang: Lang; date: string }) {
  const t = (key: keyof typeof UI) => UI[key][lang];
  const summary = snapshot.summary;
  const reasons = summary?.exec_summary.reasons.filter((r) => r.title || r.detail) ?? [];
  const decisions = summary?.decisions.filter((d) => d.text) ?? [];
  const plan = summary?.action_plan;
  const stage = STAGES.find((s) => s.key === snapshot.stage);

  return (
    <article className="mx-auto max-w-5xl space-y-12 bg-paper px-4 py-10 sm:px-8 print:max-w-none print:px-0 print:py-0">
      <header className="border-b border-line pb-8">
        <div className="mb-10 flex items-center justify-between text-sm">
          <span className="font-bold tracking-tight">{t("app.name")}</span>
          <span className="text-muted">{date}</span>
        </div>
        <div className="text-sm text-muted">
          {t("report.preparedFor")} {snapshot.clientName}
          {stage && ` · ${stage.name[lang]}`}
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{snapshot.projectName}</h1>
      </header>

      {summary && (summary.exec_summary.conclusion || reasons.length > 0) && (
        <section>
          <h2 className="mb-4 text-xs font-semibold tracking-widest text-muted uppercase">{t("summary.exec")}</h2>
          {summary.exec_summary.conclusion && (
            <p className="mb-6 text-2xl leading-snug font-semibold whitespace-pre-line">{summary.exec_summary.conclusion}</p>
          )}
          {reasons.length > 0 && (
            <ol className="grid gap-3 md:grid-cols-3">
              {reasons.map((r, i) => (
                <li key={i} className="rounded-xl border border-line bg-card p-5 break-inside-avoid">
                  <div className="mb-2 flex size-7 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">{i + 1}</div>
                  <div className="font-semibold">{r.title}</div>
                  {r.detail && <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted">{r.detail}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {decisions.length > 0 && (
        <section className="break-inside-avoid">
          <h2 className="mb-4 text-xs font-semibold tracking-widest text-muted uppercase">{t("summary.decisions")}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {decisions.map((d) => (
              <div key={d.id} className="rounded-xl border border-line bg-card p-4 break-inside-avoid">
                <span
                  className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    d.kind === "decision" ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"
                  }`}
                >
                  {t(d.kind === "decision" ? "summary.decision" : "summary.hypothesis")}
                </span>
                <p className="text-sm leading-relaxed whitespace-pre-line">{d.text}</p>
                {d.kind === "hypothesis" && d.test && (
                  <p className="mt-2 border-t border-line pt-2 text-xs text-muted">
                    {t("summary.test")}: {d.test}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {plan && (plan.objective || plan.keyResults.length > 0 || plan.tasks.length > 0) && (
        <section className="break-inside-avoid">
          <h2 className="mb-4 text-xs font-semibold tracking-widest text-muted uppercase">{t("summary.actionPlan")}</h2>
          {plan.objective && (
            <div className="mb-4 rounded-xl bg-ink p-5 text-white">
              <div className="text-xs text-white/55">
                {t("summary.objective")}
                {plan.period && ` · ${plan.period}`}
              </div>
              <div className="mt-1 text-lg font-medium">{plan.objective}</div>
            </div>
          )}
          {plan.keyResults.length > 0 && (
            <table className="mb-4 w-full overflow-hidden rounded-xl border border-line bg-card text-sm">
              <thead className="bg-paper text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">{t("summary.keyResults")}</th>
                  <th className="px-4 py-2 font-medium">{t("summary.target")}</th>
                  <th className="px-4 py-2 font-medium">{t("summary.owner")}</th>
                </tr>
              </thead>
              <tbody>
                {plan.keyResults.map((k) => (
                  <tr key={k.id} className="border-t border-line">
                    <td className="px-4 py-2.5">{k.text}</td>
                    <td className="px-4 py-2.5 tabular-nums">{k.target}</td>
                    <td className="px-4 py-2.5">{k.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {plan.tasks.length > 0 && (
            <table className="w-full overflow-hidden rounded-xl border border-line bg-card text-sm">
              <thead className="bg-paper text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">{t("summary.task")}</th>
                  <th className="px-4 py-2 font-medium">{t("summary.owner")}</th>
                  <th className="px-4 py-2 font-medium">{t("summary.due")}</th>
                </tr>
              </thead>
              <tbody>
                {plan.tasks.map((task) => (
                  <tr key={task.id} className="border-t border-line">
                    <td className="px-4 py-2.5">{task.task}</td>
                    <td className="px-4 py-2.5">{task.owner}</td>
                    <td className="px-4 py-2.5">{task.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {snapshot.questions.map((q, qi) =>
        q.analyses.length === 0 ? null : (
          <section key={qi} className="print-break">
            <div className="mb-6 border-t border-line pt-8">
              <div className="text-xs font-semibold tracking-widest text-muted uppercase">{t("report.analysis")}</div>
              <h2 className="mt-1 text-2xl font-semibold">{q.text}</h2>
            </div>
            <div className="space-y-10">
              {q.analyses.map((a, ai) => {
                const def = getFramework(a.framework_key);
                if (!def) return null;
                return (
                  <div key={ai}>
                    <h3 className="mb-1 text-lg font-semibold">{def.name[lang]}</h3>
                    <p className="mb-4 text-sm text-muted">{def.question[lang]}</p>
                    <FrameworkView frameworkKey={a.framework_key} data={a.data} lang={lang} />
                  </div>
                );
              })}
            </div>
          </section>
        ),
      )}

      <footer className="border-t border-line pt-6 text-center text-xs text-faint">
        {t("report.preparedBy")} {t("app.name")}
      </footer>
    </article>
  );
}
