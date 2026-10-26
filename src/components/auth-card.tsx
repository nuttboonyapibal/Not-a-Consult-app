import Link from "next/link";
import { LangSwitch } from "@/components/lang-switch";
import { getT } from "@/lib/i18n/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** The centered card shared by the sign-in and sign-up pages. */
export async function AuthCard({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const { t } = await getT();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="absolute top-4 right-4">
        <LangSwitch />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-3xl font-bold tracking-tight">{t("app.name")}</div>
          <p className="mt-2 text-sm text-muted">{t("app.tagline")}</p>
        </div>
        <div className="rounded-xl border border-line bg-card p-6">
          <h1 className="mb-4 text-lg font-semibold">{title}</h1>
          {isSupabaseConfigured() ? (
            children
          ) : (
            <p className="rounded-lg bg-warn-soft px-3 py-2 text-sm leading-relaxed text-warn">{t("login.notConfigured")}</p>
          )}
        </div>
        {footer && <div className="mt-4 text-center text-sm text-muted">{footer}</div>}
        {process.env.NODE_ENV === "development" && (
          <Link href="/demo" className="mt-4 block text-center text-sm font-medium text-accent hover:underline">
            {t("login.demo")} →
          </Link>
        )}
      </div>
    </main>
  );
}
