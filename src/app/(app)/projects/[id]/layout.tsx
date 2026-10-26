import Link from "next/link";
import { TabLink } from "@/components/nav-link";
import { StatusBadge } from "@/components/status";
import { Badge } from "@/components/ui";
import { getProject } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";

export default async function ProjectLayout({ children, params }: LayoutProps<"/projects/[id]">) {
  const { id } = await params;
  const { project, client } = await getProject(id);
  const { t } = await getT();
  const base = `/projects/${id}`;
  return (
    <>
      <div className="no-print mb-6">
        <div className="mb-1 text-sm text-muted">
          <Link href={`/clients/${client.id}`} className="hover:text-ink">
            {client.name}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <StatusBadge status={project.status} />
          <Badge tone={project.ai_enabled ? "accent" : "neutral"}>{project.ai_enabled ? t("project.aiOn") : t("project.aiOff")}</Badge>
        </div>
        <nav className="mt-5 flex gap-5 overflow-x-auto border-b border-line">
          <TabLink href={base} exact>
            {t("project.overview")}
          </TabLink>
          <TabLink href={`${base}/profile`}>{t("project.profile")}</TabLink>
          <TabLink href={`${base}/links`}>{t("project.links")}</TabLink>
          <TabLink href={`${base}/summary`}>{t("project.summary")}</TabLink>
          <TabLink href={`${base}/report`}>{t("project.report")}</TabLink>
          <TabLink href={`${base}/settings`}>{t("project.settings")}</TabLink>
        </nav>
      </div>
      {children}
    </>
  );
}
