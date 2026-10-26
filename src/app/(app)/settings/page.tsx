import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { getAiUsage, requireMember } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import type { Profile } from "@/lib/types";
import { AiUsage } from "./ai-usage";
import { TeamSettings } from "./team-settings";

export default async function SettingsPage() {
  const { supabase, profile } = await requireMember();
  if (profile.role !== "admin") redirect("/");
  const { t, lang } = await getT();
  const [{ data: settings }, { data: people }, usage] = await Promise.all([
    supabase.from("app_settings").select("allowed_domains").eq("id", 1).single<{ allowed_domains: string[] }>(),
    supabase.from("profiles").select("*").order("created_at"),
    getAiUsage(30),
  ]);
  return (
    <>
      <PageHeader title={t("settings.title")} />
      <div className="space-y-6">
        <TeamSettings meId={profile.id} domains={settings?.allowed_domains ?? []} people={(people ?? []) as Profile[]} />
        <AiUsage rows={usage} people={(people ?? []) as Profile[]} lang={lang} />
      </div>
    </>
  );
}
