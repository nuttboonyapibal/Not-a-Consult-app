"use client";

import type { CheckLevel, FieldDef, TableRow, TreeNode } from "@/frameworks/types";
import { useT } from "@/lib/i18n/client";
import { Input, Select, Textarea } from "../ui";
import { ListInput } from "./list-input";
import { TableInput } from "./table-input";
import { TreeInput } from "./tree-input";

const levelRing: Record<CheckLevel, string> = {
  ok: "",
  warn: "ring-2 ring-warn/25 rounded-lg",
  error: "ring-2 ring-err/25 rounded-lg",
};

export function FieldInput({
  field,
  value,
  onChange,
  actions,
  below,
  level,
  readOnly,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Small buttons next to the label, e.g. "use from profile". */
  actions?: React.ReactNode;
  /** Content under the input, e.g. an AI suggestion. */
  below?: React.ReactNode;
  level?: CheckLevel;
  readOnly?: boolean;
}) {
  const { t, tx } = useT();
  const id = `field-${field.key}`;
  return (
    <div id={`f-${field.key}`} className="scroll-mt-24">
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {tx(field.label)}
          {field.unit && <span className="ml-1 font-normal text-faint">({tx(field.unit)})</span>}
        </label>
        {actions && <div className="flex flex-wrap gap-1">{actions}</div>}
      </div>
      {field.hint && <p className="mb-2 text-xs leading-relaxed text-muted">{tx(field.hint)}</p>}
      <div className={level ? levelRing[level] : undefined}>
        <Control id={id} field={field} value={value} onChange={onChange} readOnly={readOnly} />
      </div>
      {field.example && (
        <p className="mt-1.5 text-xs text-faint">
          {t("common.example")}: {tx(field.example)}
        </p>
      )}
      {below}
    </div>
  );
}

function Control({
  id,
  field,
  value,
  onChange,
  readOnly,
}: {
  id: string;
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
}) {
  const { tx } = useT();
  const placeholder = field.placeholder ? tx(field.placeholder) : undefined;
  switch (field.type) {
    case "text":
      return (
        <Input
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      );
    case "textarea":
      return (
        <Textarea
          id={id}
          rows={3}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      );
    case "number":
      return (
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          className="max-w-56"
          value={typeof value === "number" ? value : typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          readOnly={readOnly}
        />
      );
    case "select":
      return (
        <Select id={id} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} disabled={readOnly}>
          <option value="">—</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {tx(o.label)}
            </option>
          ))}
        </Select>
      );
    case "list":
      return <ListInput id={id} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} readOnly={readOnly} />;
    case "table":
      return (
        <TableInput
          columns={field.columns ?? []}
          value={Array.isArray(value) ? (value as TableRow[]) : []}
          onChange={onChange}
          readOnly={readOnly}
        />
      );
    case "tree":
      return <TreeInput value={isTree(value) ? value : null} onChange={onChange} readOnly={readOnly} />;
  }
}

const isTree = (v: unknown): v is TreeNode =>
  !!v && typeof v === "object" && !Array.isArray(v) && Array.isArray((v as TreeNode).children);
