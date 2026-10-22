"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FRAMEWORKS } from "@/frameworks/registry";
import { LangSwitch } from "@/components/lang-switch";
import { ReportView } from "@/components/report-view";
import { cn } from "@/components/ui";
import { Workspace } from "@/app/(app)/projects/[id]/analyses/[aid]/workspace";
import { QuestionWizard } from "@/app/(app)/projects/[id]/questions/new/wizard";
import { SummaryEditor } from "@/app/(app)/projects/[id]/summary/summary-editor";
import { ClientFill } from "@/app/f/[token]/client-fill";
import { useT } from "@/lib/i18n/client";
import type { UiKey } from "@/lib/i18n/ui";
import { SCREENS, type Screen } from "./screens";
import { DEMO_FILL, DEMO_ITEMS, DEMO_PROFILE, DEMO_REPORT, DEMO_SUMMARY, demoAnalysisData, demoQuestionOf } from "./sample";


const STEP_KEYS: Record<Screen, { title: UiKey; body: UiKey }> = {
  wizard: { title: "demo.wizard", body: "demo.wizardBody" },
  workspace: { title: "demo.workspace", body: "demo.workspaceBody" },
  fill: { title: "demo.fill", body: "demo.fillBody" },
  summary: { title: "demo.summary", body: "demo.summaryBody" },
  report: { title: "demo.report", body: "demo.reportBody" },
};

const STRUCTURED = FRAMEWORKS.filter((f) => f.structured);

export function Demo({ screen, fw, empty }: { screen: Screen; fw: string; empty: boolean }) {
  const { t, tx } = useT();
  const router = useRouter();
  const index = SCREENS.indexOf(screen);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <span className="font-bold tracking-tight">{t("app.name")}</span>
          <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-medium text-warn">{t("demo.badge")}</span>
          <div className="ml-auto">
            <LangSwitch />
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {SCREENS.map((s, i) => (
            <Link
              key={s}
              href={`/demo?screen=${s}`}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm",
                s === screen ? "bg-ink text-white" : "text-muted hover:bg-black/5 hover:text-ink",
              )}
            >
              <span className="text-xs opacity-70">{i + 1}</span>
              {t(STEP_KEYS[s].title)}
            </Link>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="rounded-xl border border-accent/20 bg-accent-soft/50 px-4 py-3 text-sm leading-relaxed">
          <span className="font-semibold">
            {index + 1}. {t(STEP_KEYS[screen].title)}
          </span>{" "}
          — {t(STEP_KEYS[screen].body)}
        </div>
      </div>

      {screen === "wizard" && (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <QuestionWizard
            projectId="demo"
            stage="sme"
            aiEnabled={false}
            preset={null}
            onDemoCreate={(keys) => router.push(`/demo?screen=workspace&fw=${keys[0]}&empty=1`)}
          />
        </div>
      )}

      {screen === "workspace" && (
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted">{t("demo.pickFramework")}</span>
            {STRUCTURED.map((f) => (
              <Link
                key={f.key}
                href={`/demo?screen=workspace&fw=${f.key}${empty ? "&empty=1" : ""}`}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  f.key === fw ? "border-accent bg-accent text-white" : "border-line bg-card hover:border-accent/40",
                )}
              >
                {tx(f.name)}
              </Link>
            ))}
            <span className="mx-2 h-4 w-px bg-line" />
            <Link
              href={`/demo?screen=workspace&fw=${fw}${empty ? "" : "&empty=1"}`}
              className="rounded-full border border-line bg-card px-3 py-1 text-xs hover:border-accent/40"
            >
              {empty ? t("demo.showFilled") : t("demo.startEmpty")}
            </Link>
          </div>
          <Workspace
            key={`${fw}-${empty}`}
            projectId="demo"
            analysis={{
              id: "00000000-0000-0000-0000-0000000000a1",
              project_id: "demo",
              question_id: "demo",
              framework_key: fw,
              data: demoAnalysisData(fw, empty),
              status: "in_progress",
              position: 0,
              updated_at: new Date().toISOString(),
            }}
            question={demoQuestionOf(fw)}
            profile={DEMO_PROFILE}
            aiEnabled={false}
            demo
          />
        </div>
      )}

      {screen === "fill" && (
        <div className="py-6">
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line shadow-sm">
            <ClientFill token={"demo".repeat(10)} view={DEMO_FILL} demo />
          </div>
        </div>
      )}

      {screen === "summary" && (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <SummaryEditor
            projectId="demo"
            initial={DEMO_SUMMARY}
            initialSource="manual"
            items={DEMO_ITEMS}
            aiEnabled={false}
            reportLang="th"
            demo
          />
        </div>
      )}

      {screen === "report" && (
        <div className="py-6">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-line shadow-sm">
            <ReportView snapshot={DEMO_REPORT} lang="th" date="22 ตุลาคม 2569" />
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl justify-between px-4 pb-10 sm:px-6">
        {index > 0 ? (
          <Link href={`/demo?screen=${SCREENS[index - 1]}`} className="text-sm text-muted hover:text-ink">
            ← {t(STEP_KEYS[SCREENS[index - 1]].title)}
          </Link>
        ) : (
          <span />
        )}
        {index < SCREENS.length - 1 && (
          <Link href={`/demo?screen=${SCREENS[index + 1]}`} className="text-sm font-medium text-accent hover:underline">
            {t(STEP_KEYS[SCREENS[index + 1]].title)} →
          </Link>
        )}
      </div>
    </div>
  );
}
