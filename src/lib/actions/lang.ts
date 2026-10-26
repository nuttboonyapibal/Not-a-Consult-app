"use server";

import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { LANG_COOKIE } from "@/lib/i18n/server";

export async function setLang(lang: "th" | "en") {
  (await cookies()).set(LANG_COOKIE, lang === "en" ? "en" : "th", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  refresh();
}
