import Link from "next/link";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { requireMember } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import type { Client, Project } from "@/lib/types";
import { NewClientForm } from "./new-client-form";

export default async function DashboardPage() {
  const { supabase, profile: me } = await requireMember();
  const { t } = await getT();
  const [{ data: clients }, { data: projects }] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("updated_at", { ascending: false }),
  ]);
  const byClient = new Map<string, Project[]>();
  for (const p of (projects ?? []) as Project[]) {
    byClient.set(p.client_id, [...(byClient.get(p.client_id) ?? []), p]);
  }

  return (
    <>
      <PageHeader title={t("dash.title")} actions={<NewClientForm />} />
      {!clients?.length ? (
        <Empty>{t("dash.empty")}</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(clients as Client[]).map((client) => {
            const list = byClient.get(client.id) ?? [];
            return (
              <Card key={client.id} className="flex flex-col p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/clients/${client.id}`} className="block truncate text-lg font-semibold hover:text-accent">
                      {client.name}
                    </Link>
                    {client.industry && <div className="text-sm text-muted">{client.industry}</div>}
                  </div>
                  <Badge>
                    {list.length} {t("dash.projects")}
                  </Badge>
                </div>
                <ul className="flex-1 space-y-1">
                  {list.length === 0 && <li className="text-sm text-faint">{t("dash.noProjects")}</li>}
                  {list.slice(0, 4).map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.id}`}
                        className="-mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-paper"
                      >
                        <span className="truncate">{p.name}</span>
                        <StatusBadge status={p.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                  <Link href={`/clients/${client.id}`} className="font-medium text-accent hover:underline">
                    + {t("dash.newProject")}
                  </Link>
                  {(me.role === "admin" || client.created_by === me.id) && (
                    <Link href={`/clients/${client.id}#delete`} className="text-faint hover:text-err">
                      {t("common.delete")}
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
