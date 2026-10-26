import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, STAGES } from "@/frameworks/catalog";
import { getFramework, stepsOf } from "@/frameworks/registry";
import { Badge, Card, PageHeader } from "@/components/ui";
import { FrameworkView } from "@/components/views/framework-view";
import { requireMember } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import type { Project } from "@/lib/types";
import { UseInProject } from "./use-in-project";

export default async function FrameworkPage({ params }: PageProps<"/library/[key]">) {
  const { key } = await params;
  const def = getFramework(key);
  if (!def) notFound();
  const { supabase } = await requireMember();
  const { t, tx, lang } = await getT();
  const { data: projects } = await supabase.from("projects").select("id, name").order("updated_at", { ascending: false }).limit(50);
  const category = CATEGORIES.find((c) => c.key === def.category)!;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/library" className="hover:text-ink">
            {t("nav.library")} · {tx(category.name)}
          </Link>
        }
        title={tx(def.name)}
        description={tx(def.question)}
        actions={<UseInProject frameworkKey={def.key} projects={(projects ?? []) as Pick<Project, "id" | "name">[]} />}
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {def.example ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted">{t("common.example")}</h2>
              <FrameworkView frameworkKey={def.key} data={def.example} lang={lang} />
            </section>
          ) : (
            <Card className="p-5 text-sm text-muted">{t("fw.genericNote")}</Card>
          )}
        </div>
        <aside className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {def.topSeven && <Badge tone="accent">★ {t("fw.topSeven")}</Badge>}
              {def.structured ? <Badge tone="ok">{t("fw.structured")}</Badge> : <Badge>{t("wizard.generic")}</Badge>}
            </div>
            <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">{t("fw.howTo")}</h3>
            <p className="mt-1 text-sm leading-relaxed">{tx(def.howTo)}</p>
            <h3 className="mt-4 text-xs font-semibold tracking-wide text-warn uppercase">{t("fw.trap")}</h3>
            <p className="mt-1 text-sm leading-relaxed">{tx(def.trap)}</p>
            <h3 className="mt-4 text-xs font-semibold tracking-wide text-muted uppercase">{t("fw.stages")}</h3>
            <ul className="mt-1 space-y-0.5 text-sm">
              {def.stages.map((s) => (
                <li key={s}>
                  · {tx(STAGES.find((x) => x.key === s)!.name)}
                  {def.stagePicks.includes(s) && <span className="ml-1 text-accent">★</span>}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{t("ws.fill")}</h3>
            <ol className="space-y-1.5 text-sm">
              {stepsOf(def).map((s, i) => (
                <li key={s.id} className="flex gap-2">
                  <span className="text-faint">{i + 1}.</span>
                  {tx(s.title)}
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>
    </>
  );
}
