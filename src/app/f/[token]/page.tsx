import { UI } from "@/lib/i18n/ui";
import { LangProvider } from "@/lib/i18n/client";
import { getLang } from "@/lib/i18n/server";
import { createAnonClient } from "@/lib/supabase/server";
import type { ClientLinkView } from "@/lib/types";
import { ClientFill } from "./client-fill";

export const metadata = { title: "Fill in", robots: { index: false, follow: false } };

export default async function FillPage({ params }: PageProps<"/f/[token]">) {
  const { token } = await params;
  const { data } = await createAnonClient().rpc("client_link_get", { link_token: token });
  const view = data as ClientLinkView | null;

  if (!view) {
    const lang = await getLang();
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-line bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">{UI["fill.invalid"][lang]}</h1>
          <p className="mt-2 text-sm text-muted">{UI["fill.invalidBody"][lang]}</p>
        </div>
      </main>
    );
  }

  return (
    <LangProvider lang={view.lang}>
      <ClientFill token={token} view={view} />
    </LangProvider>
  );
}
