"use client";

import { useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { createClientAction } from "@/lib/actions/projects";
import { useT } from "@/lib/i18n/client";

export function NewClientForm() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  if (!open) return <Button onClick={() => setOpen(true)}>+ {t("dash.newClient")}</Button>;
  return (
    <form
      action={async (fd) => {
        await createClientAction(fd);
        setOpen(false);
      }}
      className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-card p-3"
    >
      <div>
        <Label htmlFor="client-name">{t("dash.clientName")}</Label>
        <Input id="client-name" name="name" required autoFocus className="w-56" />
      </div>
      <div>
        <Label htmlFor="client-industry">
          {t("dash.industry")} <span className="font-normal text-faint">({t("common.optional")})</span>
        </Label>
        <Input id="client-industry" name="industry" className="w-44" />
      </div>
      <Button type="submit">{t("common.create")}</Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        {t("common.cancel")}
      </Button>
    </form>
  );
}
