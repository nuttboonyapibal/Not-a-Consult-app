"use client";

import type { FieldDef, TableRow, TreeNode } from "@/frameworks/types";
import { Button } from "@/components/ui";
import { useT } from "@/lib/i18n/client";

function preview(field: FieldDef, value: unknown, lang: "th" | "en"): React.ReactNode {
  if (value == null) return "—";
  switch (field.type) {
    case "list":
      return (
        <ul className="space-y-0.5">
          {(value as string[]).map((v, i) => (
            <li key={i}>· {v}</li>
          ))}
        </ul>
      );
    case "table": {
      const cols = field.columns ?? [];
      return (
        <ul className="space-y-0.5">
          {(value as TableRow[]).map((r, i) => (
            <li key={i}>· {cols.map((c) => `${c.label[lang]}: ${r[c.key] ?? "—"}`).join(" · ")}</li>
          ))}
        </ul>
      );
    }
    case "tree": {
      const lines: string[] = [];
      const walk = (n: TreeNode, d: number) => {
        lines.push(`${"  ".repeat(d)}${d ? "└ " : ""}${n.text}`);
        n.children.forEach((c) => walk(c, d + 1));
      };
      walk(value as TreeNode, 0);
      return <pre className="font-sans text-xs whitespace-pre-wrap">{lines.join("\n")}</pre>;
    }
    default:
      return String(value);
  }
}

export function SuggestionCard({
  field,
  value,
  onAccept,
  onDismiss,
}: {
  field: FieldDef;
  value: unknown;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const { t, lang } = useT();
  return (
    <div className="mt-2 rounded-lg border border-accent/25 bg-accent-soft/40 p-3">
      <div className="mb-1 text-xs font-semibold text-accent">✦ {t("ws.suggestion")}</div>
      <div className="text-sm leading-relaxed">{preview(field, value, lang)}</div>
      <div className="mt-2 flex gap-2">
        <Button size="sm" onClick={onAccept}>
          {t("ws.accept")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          {t("ws.dismiss")}
        </Button>
      </div>
    </div>
  );
}
