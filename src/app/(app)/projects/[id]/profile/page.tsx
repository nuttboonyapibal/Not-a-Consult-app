import { Card } from "@/components/ui";
import { getProject } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage({ params }: PageProps<"/projects/[id]/profile">) {
  const { id } = await params;
  const { project } = await getProject(id);
  const { t } = await getT();
  return (
    <div className="max-w-3xl">
      <h2 className="text-lg font-semibold">{t("profile.title")}</h2>
      <p className="mb-5 text-sm text-muted">{t("profile.intro")}</p>
      <Card className="p-6">
        <ProfileForm projectId={id} initial={project.business_profile} />
      </Card>
    </div>
  );
}
