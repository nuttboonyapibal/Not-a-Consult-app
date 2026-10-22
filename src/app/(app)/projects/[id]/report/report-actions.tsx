"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { Badge, Button, Input } from "@/components/ui";
import { publishReport, revokeReport } from "@/lib/actions/summary";
import { useT } from "@/lib/i18n/client";
import type { ReportPublication } from "@/lib/types";

export function ReportActions({ projectId, publications }: { projectId: string; publications: ReportPublication[] }) {
  const { t, lang } = useT();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const live = publications.filter((p) => !p.revoked_at);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const res = await publishReport(projectId);
              if (res.ok) router.refresh();
              else setError(res.error);
            })
          }
        >
          {live.length ? t("report.publishAgain") : t("report.publish")}
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          {t("report.print")}
        </Button>
      </div>
      {error && <p className="rounded-lg bg-err-soft px-3 py-2 text-sm text-err">{error}</p>}
      {publications.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">{t("report.versions")}</div>
          {publications.map((p) => {
            const url = `${origin}/r/${p.token}`;
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-card p-2.5">
                <span className="text-sm">
                  {new Date(p.published_at).toLocaleString(lang === "th" ? "th-TH" : "en-US", { dateStyle: "medium", timeStyle: "short" })}
                </span>
                {p.revoked_at ? <Badge tone="err">{t("links.revoked")}</Badge> : <Badge tone="ok">{t("report.published")}</Badge>}
                {!p.revoked_at && (
                  <>
                    <Input readOnly value={url} className="h-8 min-w-0 flex-1 font-mono text-xs" onFocus={(e) => e.target.select()} />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        await navigator.clipboard.writeText(url);
                        setCopied(p.id);
                        setTimeout(() => setCopied(null), 1500);
                      }}
                    >
                      {copied === p.id ? `✓ ${t("common.copied")}` : t("common.copy")}
                    </Button>
                    <a href={url} target="_blank" rel="noreferrer" className="px-2 text-sm text-accent hover:underline">
                      {t("common.open")} ↗
                    </a>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          await revokeReport(projectId, p.id);
                          router.refresh();
                        })
                      }
                    >
                      {t("links.revoke")}
                    </Button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
