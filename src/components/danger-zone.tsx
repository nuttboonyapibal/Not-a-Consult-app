"use client";

import { useState, useTransition } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { NOT_ALLOWED, type ActionResult } from "@/lib/actions/result";
import { useT } from "@/lib/i18n/client";

/**
 * A permanent delete: lists what will be lost and asks for the name to be
 * typed before the button works. The action redirects away on success.
 */
export function DangerZone({
  title,
  name,
  consequences,
  notAllowed,
  onDelete,
}: {
  title: string;
  name: string;
  consequences: string[];
  /** Shown when the database refused the delete (see NOT_ALLOWED). */
  notAllowed: string;
  onDelete: () => Promise<ActionResult>;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const close = () => {
    setOpen(false);
    setTyped("");
    setError(null);
  };
  const remove = () =>
    start(async () => {
      setError(null);
      const res = await onDelete();
      if (!res.ok) setError(res.error === NOT_ALLOWED ? notAllowed : res.error);
    });

  return (
    <Card className="border-err/30 p-5">
      <h3 className="font-semibold text-err">{title}</h3>
      <p className="mt-1 text-sm text-muted">{t("delete.willRemove")}</p>
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">
        {consequences.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      {!open ? (
        <Button variant="danger" size="sm" className="mt-4" onClick={() => setOpen(true)}>
          {title}…
        </Button>
      ) : (
        <div className="mt-4 space-y-2">
          <Label htmlFor="confirm-name">
            {t("delete.typeName")} <span className="font-semibold">{name}</span>
          </Label>
          <Input id="confirm-name" autoFocus autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="danger" size="sm" disabled={typed.trim() !== name.trim() || pending} onClick={remove}>
              {pending ? t("delete.deleting") : t("delete.confirm")}
            </Button>
            <Button variant="ghost" size="sm" disabled={pending} onClick={close}>
              {t("common.cancel")}
            </Button>
          </div>
          {error && <p className="text-sm text-err">{error}</p>}
        </div>
      )}
    </Card>
  );
}
