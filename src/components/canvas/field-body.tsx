"use client";

import { num, str } from "@/frameworks/helpers";
import type { FieldDef, Lang, TableRow, TagColor } from "@/frameworks/types";
import { formatMetric } from "@/lib/format";
import { useT } from "@/lib/i18n/client";
import { TableInput } from "../fields/table-input";
import { EMPTY } from "../views/empty";
import type { EditApi } from "./edit-api";
import { InlineChoice, InlineNumber, InlineText } from "./inline-inputs";
import { InlineList, ReadList } from "./inline-list";
import { TreeDiagram } from "./tree-diagram";

/** The value of one field: an in-place editor with an EditApi, plain content without. */
export function FieldBody({
  field,
  value,
  edit,
  lang,
  activeTag,
}: {
  field: FieldDef;
  value: unknown;
  edit?: EditApi;
  lang: Lang;
  activeTag?: TagColor | null;
}) {
  const { t, tx } = useT();
  const data = { [field.key]: value };
  const empty = EMPTY[lang];

  if (!edit) {
    switch (field.type) {
      case "list":
        return <ReadList value={value} activeTag={activeTag} empty={empty} />;
      case "number": {
        const n = num(data, field.key);
        return n == null ? (
          <p className="text-sm text-faint italic">{empty}</p>
        ) : (
          <p className="text-lg font-semibold tabular-nums">
            {formatMetric(n, "number", lang)} {field.unit && <span className="text-xs font-normal text-muted">{field.unit[lang]}</span>}
          </p>
        );
      }
      case "select": {
        const option = field.options?.find((o) => o.value === str(data, field.key));
        return option ? (
          <span className="inline-block rounded-full bg-ink px-2.5 py-0.5 text-xs text-white">{option.label[lang]}</span>
        ) : (
          <p className="text-sm text-faint italic">{empty}</p>
        );
      }
      case "table":
        return <TableInput columns={field.columns ?? []} value={Array.isArray(value) ? (value as TableRow[]) : []} onChange={() => {}} readOnly />;
      case "tree":
        return <TreeDiagram value={value} lang={lang} />;
      default: {
        const text = str(data, field.key);
        return text ? <p className="text-sm leading-relaxed whitespace-pre-line">{text}</p> : <p className="text-sm text-faint italic">{empty}</p>;
      }
    }
  }

  const label = tx(field.label);
  const set = (v: unknown) => edit.onChange(field.key, v);
  switch (field.type) {
    case "list":
      return <InlineList fieldKey={field.key} value={value} edit={edit} label={label} />;
    case "number":
      return <InlineNumber value={num(data, field.key)} onChange={set} unit={field.unit ? tx(field.unit) : undefined} label={label} />;
    case "select":
      return <InlineChoice value={str(data, field.key)} options={field.options ?? []} onChange={set} label={label} />;
    case "table":
      return <TableInput columns={field.columns ?? []} value={Array.isArray(value) ? (value as TableRow[]) : []} onChange={set} />;
    case "tree":
      return <TreeDiagram value={value} lang={lang} onChange={set} />;
    default:
      return (
        <InlineText
          value={typeof value === "string" ? value : ""}
          onChange={set}
          singleLine={field.type === "text"}
          placeholder={t("canvas.clickToFill")}
          label={label}
        />
      );
  }
}
