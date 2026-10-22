import { getFramework } from "@/frameworks/registry";
import { getProjectContent, requireMember } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import type { ClientLink } from "@/lib/types";
import { LinksManager, type SectionOption } from "./links-manager";

export default async function LinksPage({ params }: PageProps<"/projects/[id]/links">) {
  const { id } = await params;
  const { supabase } = await requireMember();
  const { t, tx } = await getT();
  const { questions, analyses } = await getProjectContent(id);
  const { data: links } = await supabase
    .from("client_links")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  const sections: SectionOption[] = analyses.flatMap((a) => {
    const def = getFramework(a.framework_key);
    if (!def) return [];
    return [
      {
        analysisId: a.id,
        frameworkName: tx(def.name),
        question: questions.find((q) => q.id === a.question_id)?.text ?? "",
        steps: def.steps.map((s) => ({ id: s.id, title: tx(s.title) })),
      },
    ];
  });

  return (
    <div className="max-w-5xl">
      <h2 className="text-lg font-semibold">{t("links.title")}</h2>
      <p className="mb-5 max-w-2xl text-sm text-muted">{t("links.intro")}</p>
      <LinksManager projectId={id} sections={sections} links={(links ?? []) as ClientLink[]} />
    </div>
  );
}
