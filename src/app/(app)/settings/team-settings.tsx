"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui";
import { updateDomains, updateMember } from "@/lib/actions/settings";
import { useT } from "@/lib/i18n/client";
import type { Profile } from "@/lib/types";

export function TeamSettings({ meId, domains, people }: { meId: string; domains: string[]; people: Profile[] }) {
  const { t } = useT();
  const router = useRouter();
  const [value, setValue] = useState(domains.join(", "));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const res = await fn();
      setMessage(res.ok ? { ok: true, text: t("common.saved") } : { ok: false, text: res.error ?? "" });
      if (res.ok) router.refresh();
    });

  return (
    <div className="max-w-4xl space-y-6">
      <Card className="p-6">
        <Label htmlFor="domains">{t("settings.domains")}</Label>
        <p className="mb-3 text-xs text-muted">{t("settings.domainsHelp")}</p>
        <div className="flex gap-2">
          <Input id="domains" value={value} onChange={(e) => setValue(e.target.value)} placeholder="company.com" />
          <Button disabled={pending} onClick={() => run(() => updateDomains(value))}>
            {t("common.save")}
          </Button>
        </div>
        {message && <p className={`mt-2 text-xs ${message.ok ? "text-ok" : "text-err"}`}>{message.text}</p>}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-6 py-4 font-semibold">{t("settings.members")}</div>
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-xs text-muted">
            <tr>
              <th className="px-6 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">{t("settings.role")}</th>
              <th className="px-3 py-2 font-medium">{t("settings.active")}</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-6 py-2.5">
                  <div className="font-medium">{p.full_name ?? p.email}</div>
                  <div className="text-xs text-muted">{p.email}</div>
                </td>
                <td className="px-3 py-2.5">
                  {p.id === meId ? (
                    <Badge tone="accent">
                      {t("settings.admin")} ({t("settings.you")})
                    </Badge>
                  ) : (
                    <Select
                      value={p.role}
                      disabled={pending}
                      className="h-8 w-36"
                      onChange={(e) => run(() => updateMember(p.id, { role: e.target.value as Profile["role"] }))}
                    >
                      <option value="consultant">{t("settings.consultant")}</option>
                      <option value="admin">{t("settings.admin")}</option>
                    </Select>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={p.active}
                    disabled={pending || p.id === meId}
                    onChange={(e) => run(() => updateMember(p.id, { active: e.target.checked }))}
                    className="size-4 accent-accent"
                    aria-label={t("settings.active")}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
