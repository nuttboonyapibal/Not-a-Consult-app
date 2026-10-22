import { getT } from "@/lib/i18n/server";
import { LangSwitch } from "@/components/lang-switch";
import { GoogleButton } from "./google-button";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { t } = await getT();
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LangSwitch />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-3xl font-bold tracking-tight">{t("app.name")}</div>
          <p className="mt-2 text-sm text-muted">{t("app.tagline")}</p>
        </div>
        <div className="rounded-xl border border-line bg-card p-6">
          <h1 className="mb-4 text-lg font-semibold">{t("login.title")}</h1>
          {error && <p className="mb-4 rounded-lg bg-err-soft px-3 py-2 text-sm text-err">{t("login.error")}</p>}
          <GoogleButton next={nextPath} label={t("login.google")} />
          <p className="mt-4 text-xs leading-relaxed text-muted">{t("login.note")}</p>
        </div>
      </div>
    </main>
  );
}
