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
  // People waiting for approval first.
  const [{ data: people }, usage] = await Promise.all([
    supabase.from("profiles").select("*").order("active").order("created_at"),
    getAiUsage(30),
  ]);
  return (
    <>
      <PageHeader title={t("settings.title")} />
      <div className="space-y-6">
        <TeamSettings meId={profile.id} people={(people ?? []) as Profile[]} />
        <AiUsage rows={usage} people={(people ?? []) as Profile[]} lang={lang} />
      </div>
    </>
  );
}
