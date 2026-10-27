"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DangerZone } from "@/components/danger-zone";
import { Button, Card, Empty, Input, Label } from "@/components/ui";
import { deleteClientAction, updateClientAction } from "@/lib/actions/projects";
import { NOT_ALLOWED } from "@/lib/actions/result";
import { useT } from "@/lib/i18n/client";

export interface ClientRow {
  id: string;
  name: string;
  industry: string | null;
  projects: number;
  createdBy: string | null;
  createdAt: string;
  canManage: boolean;
}

/** Every client the user can see, with search, inline edit and delete. */
export function ClientsManager({ rows }: { rows: ClientRow[] }) {
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<{ id: string; mode: "edit" | "delete" } | null>(null);

  const q = query.trim().toLowerCase();
  const shown = q ? rows.filter((r) => `${r.name} ${r.industry ?? ""}`.toLowerCase().includes(q)) : rows;
  const toggle = (id: string, mode: "edit" | "delete") => setOpen((o) => (o?.id === id && o.mode === mode ? null : { id, mode }));

  return (
    <div className="space-y-4">
      <Input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("clients.search")}
        aria-label={t("clients.search")}
        className="max-w-sm"
      />
      {shown.length === 0 ? (
        <Empty>{rows.length === 0 ? t("dash.empty") : t("clients.none")}</Empty>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-paper text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-2 font-medium">{t("clients.client")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("dash.projects")}</th>
                <th className="px-3 py-2 font-medium">{t("clients.createdBy")}</th>
                <th className="px-3 py-2 font-medium">{t("clients.created")}</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <ClientRowView key={r.id} row={r} open={open?.id === r.id ? open.mode : null} onToggle={(mode) => toggle(r.id, mode)} />
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function ClientRowView({ row, open, onToggle }: { row: ClientRow; open: "edit" | "delete" | null; onToggle: (mode: "edit" | "delete") => void }) {
  const { t, lang } = useT();
  return (
    <>
      <tr className="border-t border-line align-top">
        <td className="px-5 py-3">
          <Link href={`/clients/${row.id}`} className="font-medium hover:text-accent">
            {row.name}
          </Link>
          {row.industry && <div className="text-xs text-muted">{row.industry}</div>}
        </td>
        <td className="px-3 py-3 text-right tabular-nums">{row.projects}</td>
        <td className="px-3 py-3 text-muted">{row.createdBy ?? "—"}</td>
        <td className="px-3 py-3 text-muted">{new Date(row.createdAt).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB")}</td>
        <td className="px-5 py-3 text-right whitespace-nowrap">
          {row.canManage ? (
            <span className="inline-flex gap-3">
              <button type="button" className="text-xs font-medium text-accent hover:underline" onClick={() => onToggle("edit")}>
                {t("common.edit")}
              </button>
              <button type="button" className="text-xs font-medium text-err hover:underline" onClick={() => onToggle("delete")}>
                {t("common.delete")}
              </button>
            </span>
          ) : (
            <span className="text-xs text-faint" title={t("clients.onlyOwner")}>
              {t("clients.readOnly")}
            </span>
          )}
        </td>
      </tr>
      {open && (
        <tr className="bg-paper">
          <td colSpan={5} className="px-5 py-4">
            {open === "edit" ? (
              <EditClient row={row} onDone={() => onToggle("edit")} />
            ) : (
              <div className="max-w-xl">
                <DangerZone
                  title={t("client.delete")}
                  name={row.name}
                  consequences={[
                    t("delete.clientDetails"),
                    ...(row.projects ? [t("delete.clientProjects").replace("{n}", String(row.projects))] : []),
                  ]}
                  notAllowed={t("delete.clientNotAllowed")}
                  onDelete={() => deleteClientAction(row.id, "/clients")}
                />
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function EditClient({ row, onDone }: { row: ClientRow; onDone: () => void }) {
  const { t } = useT();
  const router = useRouter();
  const [name, setName] = useState(row.name);
  const [industry, setIndustry] = useState(row.industry ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await updateClientAction(row.id, { name, industry });
      if (!res.ok) return setError(res.error === NOT_ALLOWED ? t("clients.onlyOwner") : res.error);
      onDone();
      router.refresh();
    });
  };

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-2">
      <div>
        <Label htmlFor={`name-${row.id}`}>{t("dash.clientName")}</Label>
        <Input id={`name-${row.id}`} required autoFocus maxLength={200} value={name} onChange={(e) => setName(e.target.value)} className="w-56" />
      </div>
      <div>
        <Label htmlFor={`industry-${row.id}`}>
          {t("dash.industry")} <span className="font-normal text-faint">({t("common.optional")})</span>
        </Label>
        <Input id={`industry-${row.id}`} maxLength={200} value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-44" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("common.save")}
      </Button>
      <Button type="button" variant="ghost" disabled={pending} onClick={onDone}>
        {t("common.cancel")}
      </Button>
      {error && <p className="w-full text-sm text-err">{error}</p>}
    </form>
  );
}
