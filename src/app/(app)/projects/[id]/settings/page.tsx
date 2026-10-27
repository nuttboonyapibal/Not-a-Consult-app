import { DangerZone } from "@/components/danger-zone";
import { deleteProject } from "@/lib/actions/projects";
import { getProject, requireMember } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import type { Profile } from "@/lib/types";
import { ProjectSettingsForm } from "./settings-form";

export default async function ProjectSettingsPage({ params }: PageProps<"/projects/[id]/settings">) {
  const { id } = await params;
  const { supabase, profile: me } = await requireMember();
  const { project } = await getProject(id);
  const { t } = await getT();
  const count = (table: "questions" | "analyses") =>
    supabase.from(table).select("id", { count: "exact", head: true }).eq("project_id", id);
  const [{ data: members }, { data: team }, questions, analyses, { data: links }, { data: reports }] = await Promise.all([
    supabase.from("project_members").select("user_id").eq("project_id", id),
    supabase.from("profiles").select("id, email, username, full_name, role, active").eq("active", true).order("email"),
    count("questions"),
    count("analyses"),
    supabase.from("client_links").select("id").eq("project_id", id).is("revoked_at", null),
    supabase.from("report_publications").select("id").eq("project_id", id).is("revoked_at", null),
  ]);
  const memberIds = new Set((members ?? []).map((m) => m.user_id as string));
  const canDelete = me.role === "admin" || project.created_by === me.id;

  const consequences = [
    t("delete.projectContent")
      .replace("{q}", String(questions.count ?? 0))
      .replace("{a}", String(analyses.count ?? 0)),
    ...(links?.length ? [t("delete.links").replace("{n}", String(links.length))] : []),
    ...(reports?.length ? [t("delete.reports").replace("{n}", String(reports.length))] : []),
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-lg font-semibold">{t("project.settings")}</h2>
      <ProjectSettingsForm project={project} team={(team ?? []) as Profile[]} memberIds={[...memberIds]} />
      {canDelete && (
        <DangerZone
          title={t("project.deleteProject")}
          name={project.name}
          consequences={consequences}
          notAllowed={t("delete.projectNotAllowed")}
          onDelete={deleteProject.bind(null, project.id)}
        />
      )}
    </div>
  );
}
