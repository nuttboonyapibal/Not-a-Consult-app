import { buttonClass } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

export default async function NoAccessPage() {
  const { t } = await getT();
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-xl border border-line bg-card p-6 text-center">
        <h1 className="text-lg font-semibold">{t("noAccess.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("noAccess.body")}</p>
        <form action="/auth/signout" method="post" className="mt-6">
          <button className={buttonClass("secondary")}>{t("nav.signOut")}</button>
        </form>
      </div>
    </main>
  );
}
