import type { Lang } from "@/frameworks/types";
import { ReportView } from "@/components/report-view";
import { getLang } from "@/lib/i18n/server";
import { UI } from "@/lib/i18n/ui";
import { createAnonClient } from "@/lib/supabase/server";
import type { ReportSnapshot } from "@/lib/types";
import { PrintButton } from "./print-button";

export const metadata = { title: "Report", robots: { index: false, follow: false } };

export default async function PublicReportPage({ params }: PageProps<"/r/[token]">) {
  const { token } = await params;
  const { data } = await createAnonClient().rpc("public_report_get", { report_token: token });
  const report = data as { snapshot: ReportSnapshot; lang: Lang; published_at: string } | null;

  if (!report) {
    const lang = await getLang();
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-line bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">{UI["report.notFound"][lang]}</h1>
          <p className="mt-2 text-sm text-muted">{UI["report.notFoundBody"][lang]}</p>
        </div>
      </main>
    );
  }

  const date = new Date(report.published_at).toLocaleDateString(report.lang === "th" ? "th-TH" : "en-US", { dateStyle: "long" });
  return (
    <main className="min-h-screen bg-paper">
      <div className="no-print mx-auto flex max-w-5xl justify-end px-4 pt-4 sm:px-8">
        <PrintButton label={UI["report.print"][report.lang]} />
      </div>
      <ReportView snapshot={report.snapshot} lang={report.lang} date={date} />
    </main>
  );
}
