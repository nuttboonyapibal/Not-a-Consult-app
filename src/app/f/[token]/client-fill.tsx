"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { PROFILE_FIELDS } from "@/frameworks/profile";
import { getFramework } from "@/frameworks/registry";
import type { Data } from "@/frameworks/types";
import { FieldInput } from "@/components/fields/field-input";
import { SaveIndicator } from "@/components/fields/save-indicator";
import { useAutosave } from "@/components/fields/use-autosave";
import { Button, Card } from "@/components/ui";
import { saveFill, submitFill } from "@/lib/actions/fill";
import { useT } from "@/lib/i18n/client";
import type { ClientLinkView } from "@/lib/types";

type Register = (flush: () => Promise<void>) => () => void;

function useRegisteredAutosave(initial: Data, save: (patch: Data) => ReturnType<typeof saveFill>, register: Register) {
  const autosave = useAutosave(initial, save);
  const { flush } = autosave;
  useEffect(() => register(flush), [register, flush]);
  return autosave;
}

function ProfileSection({ token, fields, initial, register }: { token: string; fields: string[]; initial: Data; register: Register }) {
  const { t } = useT();
  const { data, setField, state } = useRegisteredAutosave(initial, (patch) => saveFill(token, null, patch), register);
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("fill.about")}</h2>
        <SaveIndicator state={state} />
      </div>
      <div className="space-y-6">
        {PROFILE_FIELDS.filter((f) => fields.includes(f.key)).map((f) => (
          <FieldInput key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />
        ))}
      </div>
    </Card>
  );
}

function AnalysisSection({ token, item, register }: { token: string; item: ClientLinkView["analyses"][number]; register: Register }) {
  const { t, tx } = useT();
  const def = getFramework(item.framework_key);
  const { data, setField, state } = useRegisteredAutosave(item.data, (patch) => saveFill(token, item.id, patch), register);
  if (!def) return null;
  const steps = def.steps
    .map((s) => ({ ...s, fields: s.fields.filter((f) => item.fields.includes(f.key)) }))
    .filter((s) => s.fields.length > 0);
  return (
    <Card className="p-6">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div>
          <div className="text-xs text-muted">
            {t("fill.forQuestion")}: {item.question}
          </div>
          <h2 className="text-lg font-semibold">{tx(def.name)}</h2>
        </div>
        <SaveIndicator state={state} />
      </div>
      <p className="mb-6 text-sm text-muted">{tx(def.howTo)}</p>
      <div className="space-y-8">
        {steps.map((step) => (
          <section key={step.id}>
            <h3 className="mb-1 font-medium">{tx(step.title)}</h3>
            {step.intro && <p className="mb-4 text-sm text-muted">{tx(step.intro)}</p>}
            <div className="space-y-6">
              {step.fields.map((f) => (
                <FieldInput key={f.key} field={f} value={data[f.key]} onChange={(v) => setField(f.key, v)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Card>
  );
}

export function ClientFill({ token, view }: { token: string; view: ClientLinkView }) {
  const { t } = useT();
  const [submitted, setSubmitted] = useState(!!view.submitted_at);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const flushers = useRef(new Set<() => Promise<void>>());
  const register = useCallback<Register>((flush) => {
    flushers.current.add(flush);
    return () => flushers.current.delete(flush);
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="font-bold tracking-tight">{t("app.name")}</div>
          <div className="text-sm text-muted">{view.client_name}</div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold">{t("fill.welcome")}</h1>
          <p className="mt-1 text-sm text-muted">{view.project_name}</p>
          {view.message && <p className="mt-4 rounded-xl bg-accent-soft/60 p-4 text-sm leading-relaxed whitespace-pre-line">{view.message}</p>}
          <p className="mt-4 text-sm text-muted">{t("fill.intro")}</p>
        </div>
        {view.profile_fields.length > 0 && (
          <ProfileSection token={token} fields={view.profile_fields} initial={view.profile} register={register} />
        )}
        {view.analyses.map((item) => (
          <AnalysisSection key={item.id} token={token} item={item} register={register} />
        ))}
        <div className="rounded-xl border border-line bg-card p-5 text-center">
          {submitted ? (
            <p className="text-sm text-ok">✓ {t("fill.submitted")}</p>
          ) : (
            <>
              {error && <p className="mb-3 text-sm text-err">{error}</p>}
              <Button
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await Promise.all([...flushers.current].map((flush) => flush()));
                    const res = await submitFill(token);
                    if (res.ok) setSubmitted(true);
                    else setError(res.error);
                  })
                }
              >
                {t("fill.submit")}
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
