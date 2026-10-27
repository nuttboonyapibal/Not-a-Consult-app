import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { getT } from "@/lib/i18n/server";
import { PasswordSignIn } from "./password-sign-in";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { t } = await getT();
  const { next } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return (
    <AuthCard
      title={t("login.title")}
      footer={
        <>
          {t("login.noAccount")}{" "}
          <Link href="/signup" className="font-medium text-accent hover:underline">
            {t("login.signUpLink")}
          </Link>
        </>
      }
    >
      <PasswordSignIn next={nextPath} />
      <p className="mt-4 text-xs leading-relaxed text-muted">{t("login.forgot")}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{t("login.note")}</p>
    </AuthCard>
  );
}
