import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { LangProvider } from "@/lib/i18n/client";
import { getLang } from "@/lib/i18n/server";
import "./globals.css";

const plex = IBM_Plex_Sans_Thai({
  variable: "--font-plex",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Not a Consult", template: "%s · Not a Consult" },
  description: "Framework-driven business analysis for consulting teams",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${plex.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
