import { Card, PageHeader } from "@/components/ui";
import { displayName } from "@/lib/auth/username";
import { requireMember } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import { ChangePassword } from "./change-password";

export default async function AccountPage() {
  const { profile } = await requireMember();
  const { t } = await getT();
  return (
    <>
      <PageHeader title={t("account.title")} />
      <div className="max-w-md space-y-6">
        <Card className="p-6">
          <div className="text-lg font-semibold">{displayName(profile)}</div>
          <div className="text-sm text-muted">{profile.username ? `@${profile.username}` : t("account.noUsername")}</div>
        </Card>
        {profile.username && <ChangePassword username={profile.username} />}
      </div>
    </>
  );
}
