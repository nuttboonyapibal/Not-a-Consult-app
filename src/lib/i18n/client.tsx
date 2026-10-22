"use client";

import { createContext, useContext, useMemo } from "react";
import type { L, Lang } from "@/frameworks/types";
import { UI, type UiKey } from "./ui";

const LangContext = createContext<Lang>("th");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useT() {
  const lang = useContext(LangContext);
  return useMemo(
    () => ({
      lang,
      t: (key: UiKey) => UI[key][lang],
      tx: (text: L) => text[lang],
    }),
    [lang],
  );
}
