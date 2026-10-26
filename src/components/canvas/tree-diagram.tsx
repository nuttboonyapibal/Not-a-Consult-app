"use client";

import { newItemId, tree } from "@/frameworks/helpers";
import type { Lang, TreeNode } from "@/frameworks/types";
import { useT } from "@/lib/i18n/client";
import { cn } from "../ui";
import { EMPTY } from "../views/empty";

const MAX_DEPTH = 3;

function updateNode(node: TreeNode, id: string, fn: (n: TreeNode) => TreeNode): TreeNode {
  if (node.id === id) return fn(node);
  return { ...node, children: node.children.map((c) => updateNode(c, id, fn)) };
}

function removeNode(node: TreeNode, id: string): TreeNode {
  return { ...node, children: node.children.filter((c) => c.id !== id).map((c) => removeNode(c, id)) };
}

const boxStyle = (depth: number) =>
  depth === 0
    ? "w-52 border-ink bg-ink font-semibold text-white"
    : depth === 1
      ? "w-48 border-accent/30 bg-accent-soft font-medium"
      : "w-44 border-line bg-card";

/** Left-to-right issue tree. Editable in place when `onChange` is given. */
export function TreeDiagram({ value, lang, onChange }: { value: unknown; lang: Lang; onChange?: (value: TreeNode) => void }) {
  const parsed = tree({ v: value }, "v");
  const root = parsed ?? { id: "root", text: "", children: [] };
  if (!onChange && (!parsed || (!parsed.text && parsed.children.length === 0))) {
    return <p className="text-sm text-faint italic">{EMPTY[lang]}</p>;
  }
  const actions = onChange && {
    text: (id: string, text: string) => onChange(updateNode(root, id, (n) => ({ ...n, text }))),
    add: (id: string) =>
      onChange(updateNode(root, id, (n) => ({ ...n, children: [...n.children, { id: newItemId(), text: "", children: [] }] }))),
    remove: (id: string) => onChange(removeNode(root, id)),
  };
  return (
    <div className="overflow-x-auto pb-1">
      <Node node={root} depth={0} actions={actions} />
    </div>
  );
}

function Node({
  node,
  depth,
  actions,
}: {
  node: TreeNode;
  depth: number;
  actions?: { text: (id: string, text: string) => void; add: (id: string) => void; remove: (id: string) => void };
}) {
  const { t } = useT();
  return (
    <div className="flex items-center">
      <div className={cn("group relative shrink-0 rounded-lg border text-sm leading-snug", boxStyle(depth))}>
        {actions ? (
          <>
            <textarea
              rows={1}
              value={node.text}
              aria-label={`level ${depth}`}
              placeholder={depth === 0 ? t("canvas.clickToFill") : "…"}
              onChange={(e) => actions.text(node.id, e.target.value.replace(/\n/g, " "))}
              ref={(el) => {
                if (!el) return;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
              className={cn(
                "block w-full resize-none overflow-hidden bg-transparent px-3 py-2 outline-none",
                depth === 0 ? "placeholder:text-white/50" : "placeholder:text-faint",
              )}
            />
            <div className="absolute -right-2 -bottom-2 flex gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              {depth < MAX_DEPTH && (
                <button
                  type="button"
                  onClick={() => actions.add(node.id)}
                  title={depth === 0 ? t("ws.addBranch") : t("ws.addChild")}
                  aria-label={depth === 0 ? t("ws.addBranch") : t("ws.addChild")}
                  className="flex size-5 items-center justify-center rounded-full bg-accent text-xs text-white shadow"
                >
                  +
                </button>
              )}
              {depth > 0 && (
                <button
                  type="button"
                  onClick={() => actions.remove(node.id)}
                  title={t("common.remove")}
                  aria-label={t("common.remove")}
                  className="flex size-5 items-center justify-center rounded-full border border-line bg-card text-[10px] text-err shadow"
                >
                  ✕
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="px-3 py-2">{node.text || "…"}</div>
        )}
      </div>
      {node.children.length > 0 && (
        <>
          <div className="h-px w-5 shrink-0 bg-line" />
          <div className="relative flex flex-col gap-2 border-l border-line py-1 pl-5">
            {node.children.map((c) => (
              <div key={c.id} className="relative">
                <div className="absolute top-1/2 -left-5 h-px w-5 bg-line" />
                <Node node={c} depth={depth + 1} actions={actions} />
              </div>
            ))}
          </div>
        </>
      )}
      {actions && depth === 0 && node.children.length === 0 && (
        <button
          type="button"
          onClick={() => actions.add(node.id)}
          className="ml-3 rounded-md border border-dashed border-accent/40 px-3 py-1.5 text-xs text-accent hover:bg-accent-soft"
        >
          + {t("ws.addBranch")}
        </button>
      )}
    </div>
  );
}
