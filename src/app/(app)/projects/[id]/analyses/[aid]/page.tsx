import { notFound } from "next/navigation";
import { getFramework } from "@/frameworks/registry";
import { getProject, requireMember } from "@/lib/dal";
import type { Analysis, Question } from "@/lib/types";
import { Workspace } from "./workspace";

export default async function AnalysisPage({ params }: PageProps<"/projects/[id]/analyses/[aid]">) {
  const { id, aid } = await params;
  const { project } = await getProject(id);
  const { supabase } = await requireMember();
  const { data: analysis } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", aid)
    .eq("project_id", id)
    .maybeSingle<Analysis>();
  if (!analysis || !getFramework(analysis.framework_key)) notFound();
  const { data: question } = await supabase.from("questions").select("*").eq("id", analysis.question_id).single<Question>();

  return (
    <Workspace
      key={analysis.id}
      projectId={id}
      analysis={analysis}
      question={question?.text ?? ""}
      profile={project.business_profile}
      aiEnabled={project.ai_enabled}
    />
  );
}
