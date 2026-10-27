import { PageHeader } from "@/components/ui";
import { displayName } from "@/lib/auth/username";
import { requireMember } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import { NewClientForm } from "../new-client-form";
import { ClientsManager, type ClientRow } from "./clients-manager";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const { supabase, profile: me } = await requireMember();
  const { t } = await getT();
  const [{ data: clients }, { data: projects }, { data: people }] = await Promise.all([
    supabase.from("clients").select("id, name, industry, created_by, created_at").order("name"),
    supabase.from("projects").select("client_id"),
    supabase.from("profiles").select("id, email, username, full_name"),
  ]);
  const projectCount = new Map<string, number>();
  for (const p of projects ?? []) projectCount.set(p.client_id, (projectCount.get(p.client_id) ?? 0) + 1);

  const rows: ClientRow[] = (clients ?? []).map((c) => {
    const creator = people?.find((p) => p.id === c.created_by);
    return {
      id: c.id,
      name: c.name,
      industry: c.industry,
      projects: projectCount.get(c.id) ?? 0,
      createdBy: creator ? displayName(creator) : null,
      createdAt: c.created_at,
      // Matches RLS: the creator or an admin may edit or delete.
      canManage: me.role === "admin" || c.created_by === me.id,
    };
  });

  return (
    <>
      <PageHeader title={t("clients.title")} description={t("clients.intro")} actions={<NewClientForm />} />
      <ClientsManager rows={rows} />
    </>
  );
}
