import Link from "next/link";
import { notFound } from "next/navigation";
import { DangerZone } from "@/components/danger-zone";
import { Card, Empty, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { deleteClientAction } from "@/lib/actions/projects";
import { requireMember } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import type { Client, Project } from "@/lib/types";
import { NewProjectForm } from "./new-project-form";

export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const { id } = await params;
  const { supabase, profile: me } = await requireMember();
  const { t } = await getT();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).maybeSingle<Client>();
  if (!client) notFound();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", id)
    .order("updated_at", { ascending: false });

  return (
    <>
      <PageHeader
        eyebrow={<Link href="/" className="hover:text-ink">{t("nav.dashboard")}</Link>}
        title={client.name}
        description={client.industry ?? undefined}
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted">{t("dash.projects")}</h2>
          {!projects?.length ? (
            <Empty>{t("dash.noProjects")}</Empty>
          ) : (
            <div className="space-y-2">
              {(projects as Project[]).map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="block">
                  <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:border-accent/40">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{p.name}</div>
                      <div className="text-xs text-muted">{new Date(p.updated_at).toLocaleDateString()}</div>
                    </div>
                    <StatusBadge status={p.status} />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
        <aside className="space-y-6">
          <NewProjectForm clientId={client.id} />
          {(me.role === "admin" || client.created_by === me.id) && (
            <DangerZone
              title={t("client.delete")}
              name={client.name}
              consequences={[
                t("delete.clientDetails"),
                ...(projects?.length ? [t("delete.clientProjects").replace("{n}", String(projects.length))] : []),
              ]}
              notAllowed={t("delete.clientNotAllowed")}
              onDelete={deleteClientAction.bind(null, client.id)}
            />
          )}
        </aside>
      </div>
    </>
  );
}
