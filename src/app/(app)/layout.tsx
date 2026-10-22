import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { NavLink } from "@/components/nav-link";
import { requireMember } from "@/lib/dal";
import { getT } from "@/lib/i18n/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireMember();
  const { t } = await getT();
  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-tight">
            {t("app.name")}
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/" exact>
              {t("nav.dashboard")}
            </NavLink>
            <NavLink href="/library">{t("nav.library")}</NavLink>
            {profile.role === "admin" && <NavLink href="/settings">{t("nav.settings")}</NavLink>}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LangSwitch />
            <span className="hidden text-sm text-muted md:inline">{profile.full_name ?? profile.email}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg px-2.5 py-1 text-sm text-muted hover:bg-black/5 hover:text-ink">{t("nav.signOut")}</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
