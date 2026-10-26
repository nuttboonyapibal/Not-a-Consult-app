import { getFramework } from "@/frameworks/registry";
import { getProject } from "@/lib/dal";
import { QuestionWizard } from "./wizard";

export default async function NewQuestionPage({ params, searchParams }: PageProps<"/projects/[id]/questions/new">) {
  const { id } = await params;
  const { framework } = await searchParams;
  const { project } = await getProject(id);
  const preset = typeof framework === "string" && getFramework(framework) ? framework : null;
  return <QuestionWizard projectId={id} stage={project.stage} aiEnabled={project.ai_enabled} preset={preset} />;
}
