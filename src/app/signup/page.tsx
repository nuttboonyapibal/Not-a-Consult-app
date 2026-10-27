import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { getT } from "@/lib/i18n/server";
import { SignUpForm } from "./sign-up-form";

export const metadata = { title: "Sign up" };

export default async function SignUpPage() {
  const { t } = await getT();
  return (
    <AuthCard
      title={t("signup.title")}
      footer={
        <>
          {t("signup.haveAccount")}{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            {t("login.title")}
          </Link>
        </>
      }
    >
      <SignUpForm />
      <p className="mt-4 text-xs leading-relaxed text-muted">{t("signup.note")}</p>
    </AuthCard>
  );
}
