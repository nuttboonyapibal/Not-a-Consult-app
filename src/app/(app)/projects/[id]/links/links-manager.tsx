"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { Badge, Button, Card, Empty, Input, Label, Select, Textarea } from "@/components/ui";
import { createLink, revokeLink } from "@/lib/actions/links";
import { useT } from "@/lib/i18n/client";
import type { ClientLink } from "@/lib/types";

export interface SectionOption {
  analysisId: string;
  frameworkName: string;
  question: string;
  steps: { id: string; title: string }[];
}

function CopyButton({ text }: { text: string }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? `✓ ${t("common.copied")}` : t("common.copy")}
    </Button>
  );
}

export function LinksManager({ projectId, sections, links }: { projectId: string; sections: SectionOption[]; links: ClientLink[] }) {
  const { t, lang } = useT();
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");
  const [days, setDays] = useState("14");
  const [includeProfile, setIncludeProfile] = useState(true);
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );

  const toggleSection = (s: SectionOption) =>
    setPicked(({ [s.analysisId]: current, ...rest }) => (current ? rest : { ...rest, [s.analysisId]: s.steps.map((x) => x.id) }));

  const toggleStep = (s: SectionOption, stepId: string) =>
    setPicked((p) => {
      const current = p[s.analysisId] ?? [];
      const next = current.includes(stepId) ? current.filter((x) => x !== stepId) : [...current, stepId];
      const rest = { ...p };
      delete rest[s.analysisId];
      return next.length ? { ...rest, [s.analysisId]: next } : rest;
    });

  function create() {
    setError(null);
    if (!includeProfile && Object.keys(picked).length === 0) {
      setError(t("links.nothingPicked"));
      return;
    }
    start(async () => {
      const res = await createLink({
        projectId,
        label,
        message,
        expiresInDays: days === "never" ? null : Number(days),
        includeProfile,
        analyses: picked,
      });
      if (!res.ok) setError(res.error);
      else {
        setLabel("");
        setMessage("");
        setPicked({});
        router.refresh();
      }
    });
  }

  const now = Date.now();
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-3">
        {links.length === 0 && <Empty>{t("links.none")}</Empty>}
        {links.map((link) => {
          const expired = link.expires_at && new Date(link.expires_at).getTime() < now;
          const url = `${origin}/f/${link.token}`;
          const live = !link.revoked_at && !expired;
          return (
            <Card key={link.id} className="p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-medium">{link.label || new Date(link.created_at).toLocaleDateString(lang === "th" ? "th-TH" : "en-US")}</span>
                {link.revoked_at ? (
                  <Badge tone="err">{t("links.revoked")}</Badge>
                ) : expired ? (
                  <Badge tone="err">{t("links.expired")}</Badge>
                ) : link.submitted_at ? (
                  <Badge tone="ok">{t("links.submitted")}</Badge>
                ) : link.opened_at ? (
                  <Badge tone="accent">{t("links.opened")}</Badge>
                ) : (
                  <Badge>{t("links.notOpened")}</Badge>
                )}
                {link.expires_at && live && (
                  <span className="text-xs text-muted">
                    {t("links.expires")} {new Date(link.expires_at).toLocaleDateString(lang === "th" ? "th-TH" : "en-US")}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted">
                {[
                  link.scope.profile.length ? t("links.includeProfile") : null,
                  ...Object.keys(link.scope.analyses).map((id) => sections.find((s) => s.analysisId === id)?.frameworkName ?? "—"),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {live && (
                <div className="mt-3 flex items-center gap-2">
                  <Input readOnly value={url} className="h-8 font-mono text-xs" onFocus={(e) => e.target.select()} />
                  <CopyButton text={url} />
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        await revokeLink(projectId, link.id);
                        router.refresh();
                      })
                    }
                  >
                    {t("links.revoke")}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </section>

      <Card className="h-fit p-5">
        <h3 className="mb-4 font-semibold">{t("links.new")}</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="link-label">{t("links.label")}</Label>
            <Input id="link-label" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="link-message">{t("links.message")}</Label>
            <Textarea id="link-message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="link-days">{t("links.expires")}</Label>
            <Select id="link-days" value={days} onChange={(e) => setDays(e.target.value)}>
              {["7", "14", "30", "90"].map((d) => (
                <option key={d} value={d}>
                  {d} {t("links.days")}
                </option>
              ))}
              <option value="never">{t("links.never")}</option>
            </Select>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">{t("links.pickSections")}</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeProfile} onChange={(e) => setIncludeProfile(e.target.checked)} className="size-4 accent-accent" />
                {t("links.includeProfile")}
              </label>
              {sections.map((s) => (
                <div key={s.analysisId} className="rounded-lg border border-line p-2.5">
                  <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" checked={!!picked[s.analysisId]} onChange={() => toggleSection(s)} className="mt-1 size-4 accent-accent" />
                    <span>
                      <span className="font-medium">{s.frameworkName}</span>
                      <span className="block text-xs text-muted">{s.question}</span>
                    </span>
                  </label>
                  {picked[s.analysisId] && s.steps.length > 1 && (
                    <div className="mt-2 ml-6 space-y-1">
                      {s.steps.map((step) => (
                        <label key={step.id} className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={picked[s.analysisId].includes(step.id)}
                            onChange={() => toggleStep(s, step.id)}
                            className="size-3.5 accent-accent"
                          />
                          {step.title}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <p className="rounded-lg bg-warn-soft p-2.5 text-xs leading-relaxed text-warn">{t("links.privacy")}</p>
          {error && <p className="rounded-lg bg-err-soft px-3 py-2 text-sm text-err">{error}</p>}
          <Button className="w-full" disabled={pending} onClick={create}>
            {t("links.new")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
