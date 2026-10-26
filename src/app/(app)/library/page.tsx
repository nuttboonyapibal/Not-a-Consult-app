import Link from "next/link";
import { CATEGORIES, STAGES } from "@/frameworks/catalog";
import { frameworksIn } from "@/frameworks/registry";
import { Badge, Card, PageHeader } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Library" };

export default async function LibraryPage() {
  const { t, tx } = await getT();
  return (
    <>
      <PageHeader title={t("nav.library")} description={t("wizard.pickHint")} />
      <div className="space-y-10">
        {CATEGORIES.map((c, i) => (
          <section key={c.key}>
            <div className="mb-3">
              <div className="text-xs font-medium text-muted">
                {i + 1}. {tx(c.name)}
              </div>
              <h2 className="text-lg font-semibold">{tx(c.question)}</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {frameworksIn(c.key).map((f) => (
                <Link key={f.key} href={`/library/${f.key}`} className="block">
                  <Card className="h-full p-4 transition-colors hover:border-accent/40">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold">{tx(f.name)}</span>
                      {f.topSeven && <Badge tone="accent">★ Top 7</Badge>}
                      {f.structured ? <Badge tone="ok">{t("fw.structured")}</Badge> : <Badge>{t("wizard.generic")}</Badge>}
                    </div>
                    <p className="text-sm text-muted">{tx(f.question)}</p>
                    <p className="mt-2 text-xs text-warn">
                      {t("fw.trap")}: {tx(f.trap)}
                    </p>
                    {f.stagePicks.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {f.stagePicks.map((s) => (
                          <Badge key={s}>{tx(STAGES.find((x) => x.key === s)!.name).split(" ")[0]}</Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
