import "server-only";
import { cookies } from "next/headers";
import type { L, Lang } from "@/frameworks/types";
import { UI, type UiKey } from "./ui";

export const LANG_COOKIE = "lang";

export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return value === "en" ? "en" : "th";
}

export async function getT() {
  const lang = await getLang();
  return {
    lang,
    t: (key: UiKey) => UI[key][lang],
    tx: (text: L) => text[lang],
  };
}
