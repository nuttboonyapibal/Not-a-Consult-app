"use client";

import type { ColumnDef, TableRow } from "@/frameworks/types";
import { useT } from "@/lib/i18n/client";
import { Button } from "../ui";

const newRowId = () => Math.random().toString(36).slice(2, 10);

export function TableInput({
  columns,
  value,
  onChange,
  readOnly,
}: {
  columns: ColumnDef[];
  value: TableRow[];
  onChange: (value: TableRow[]) => void;
  readOnly?: boolean;
}) {
  const { t, tx } = useT();

  const update = (rowId: string, key: string, cell: string | number | null) =>
    onChange(value.map((r) => (r.id === rowId ? { ...r, [key]: cell } : r)));

  const addRow = () =>
    onChange([...value, { id: newRowId(), ...Object.fromEntries(columns.map((c) => [c.key, c.type === "number" ? null : ""])) }]);

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[480px] text-sm">
        <thead className="bg-paper text-left text-xs text-muted">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-2 py-2 font-medium">
                {tx(c.label)}
              </th>
            ))}
            {!readOnly && <th className="w-8" />}
          </tr>
        </thead>
        <tbody>
          {value.map((row) => (
            <tr key={row.id} className="border-t border-line">
              {columns.map((c) => (
                <td key={c.key} className="p-1">
                  {c.type === "select" ? (
                    <select
                      value={(row[c.key] as string) ?? ""}
                      disabled={readOnly}
                      onChange={(e) => update(row.id, c.key, e.target.value)}
                      className="h-9 w-full rounded-md border border-transparent bg-transparent px-2 hover:border-line focus:border-accent focus:outline-none"
                    >
                      <option value="">—</option>
                      {c.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {tx(o.label)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={c.type === "number" ? "number" : "text"}
                      inputMode={c.type === "number" ? "decimal" : undefined}
                      value={row[c.key] ?? ""}
                      readOnly={readOnly}
                      aria-label={tx(c.label)}
                      onChange={(e) =>
                        update(row.id, c.key, c.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)
                      }
                      className={`h-9 w-full rounded-md border border-transparent bg-transparent px-2 hover:border-line focus:border-accent focus:outline-none ${
                        c.type === "number" ? "text-right tabular-nums" : ""
                      }`}
                    />
                  )}
                </td>
              ))}
              {!readOnly && (
                <td className="pr-1 text-center">
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((r) => r.id !== row.id))}
                    className="rounded px-1.5 text-faint hover:text-err"
                    aria-label={t("common.remove")}
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!readOnly && (
        <div className="border-t border-line p-1.5">
          <Button type="button" variant="ghost" size="sm" onClick={addRow}>
            + {t("ws.addRow")}
          </Button>
        </div>
      )}
    </div>
  );
}
