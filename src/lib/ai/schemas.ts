import "server-only";
import { z } from "zod";
import type { FieldDef, TableRow, TreeNode } from "@/frameworks/types";

// Structured outputs don't allow recursive schemas, so the tree is three levels deep.
const Leaf = z.object({ text: z.string() });
const Level2 = z.object({ text: z.string(), children: z.array(Leaf) });
const Level1 = z.object({ text: z.string(), children: z.array(Level2) });
const TreeSchema = z.object({ text: z.string(), children: z.array(Level1) });

type AiTree = z.infer<typeof TreeSchema>;

function fieldSchema(field: FieldDef): z.ZodType {
  switch (field.type) {
    case "number":
      return z.number().nullable();
    case "list":
      return z.array(z.string());
    case "select":
      return field.options?.length ? z.enum(["", ...field.options.map((o) => o.value)] as [string, ...string[]]) : z.string();
    case "table":
      return z.array(
        z.object(
          Object.fromEntries((field.columns ?? []).map((c) => [c.key, c.type === "number" ? z.number().nullable() : z.string()])),
        ),
      );
    case "tree":
      return TreeSchema.nullable();
    default:
      return z.string();
  }
}

/** Schema for AI-drafted values of the given fields. */
export function valuesSchema(fields: FieldDef[]) {
  return z.object(Object.fromEntries(fields.map((f) => [f.key, fieldSchema(f)])));
}

const rid = () => Math.random().toString(36).slice(2, 10);

function toTree(node: AiTree | AiTree["children"][number] | { text: string; children?: unknown[] }, isRoot = false): TreeNode {
  const children = (node as { children?: unknown[] }).children ?? [];
  return {
    id: isRoot ? "root" : rid(),
    text: node.text,
    children: children.map((c) => toTree(c as { text: string; children?: unknown[] })),
  };
}

/** Adds the ids the editors need to AI values. */
export function normalizeValues(fields: FieldDef[], values: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.key];
    if (f.type === "table" && Array.isArray(v)) out[f.key] = v.map((r) => ({ id: rid(), ...(r as object) }) as TableRow);
    else if (f.type === "tree" && v) out[f.key] = toTree(v as AiTree, true);
    else out[f.key] = v;
  }
  return out;
}
