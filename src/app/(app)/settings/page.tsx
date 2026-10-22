import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireMember } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import type { Profile } from "@/lib/types";
import { TeamSettings } from "./team-settings";

export default async function SettingsPage() {
  const { supabase, profile } = await requireMember();
  if (profile.role !== "admin") redirect("/");
  const { t } = await getT();
  const [{ data: settings }, { data: people }] = await Promise.all([
    supabase.from("app_settings").select("allowed_domains").eq("id", 1).single<{ allowed_domains: string[] }>(),
    supabase.from("profiles").select("*").order("created_at"),
  ]);
  return (
    <>
      <PageHeader title={t("settings.title")} />
      <TeamSettings meId={profile.id} domains={settings?.allowed_domains ?? []} people={(people ?? []) as Profile[]} />
    </>
  );
}
