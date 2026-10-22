"use client";

import { useTransition } from "react";
import { setLang } from "@/lib/actions/lang";
import { useT } from "@/lib/i18n/client";
import { cn } from "./ui";

export function LangSwitch({ className }: { className?: string }) {
  const { lang, t } = useT();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => setLang(lang === "th" ? "en" : "th"))}
      className={cn("rounded-lg px-2.5 py-1 text-sm text-muted hover:bg-black/5 hover:text-ink", className)}
    >
      {t("lang.switch")}
    </button>
  );
}
