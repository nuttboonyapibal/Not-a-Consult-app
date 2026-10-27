import Link from "next/link";
import { buttonClass } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

export default async function NoAccessPage() {
  const { t } = await getT();
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-xl border border-line bg-card p-6 text-center">
        <h1 className="text-lg font-semibold">{t("noAccess.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("noAccess.body")}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/" className={buttonClass("primary")}>
            {t("noAccess.retry")}
          </Link>
          <form action="/auth/signout" method="post">
            <button className={buttonClass("secondary")}>{t("nav.signOut")}</button>
          </form>
        </div>
      </div>
    </main>
  );
}
