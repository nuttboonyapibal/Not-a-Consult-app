import { getProject, requireMember } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import type { Profile } from "@/lib/types";
import { ProjectSettingsForm } from "./settings-form";

export default async function ProjectSettingsPage({ params }: PageProps<"/projects/[id]/settings">) {
  const { id } = await params;
  const { supabase, profile: me } = await requireMember();
  const { project } = await getProject(id);
  const { t } = await getT();
  const [{ data: members }, { data: team }] = await Promise.all([
    supabase.from("project_members").select("user_id").eq("project_id", id),
    supabase.from("profiles").select("id, email, username, full_name, role, active").eq("active", true).order("email"),
  ]);
  const memberIds = new Set((members ?? []).map((m) => m.user_id as string));

  return (
    <div className="max-w-3xl">
      <h2 className="mb-5 text-lg font-semibold">{t("project.settings")}</h2>
      <ProjectSettingsForm
        project={project}
        team={(team ?? []) as Profile[]}
        memberIds={[...memberIds]}
        canDelete={me.role === "admin" || project.created_by === me.id}
      />
    </div>
  );
}
