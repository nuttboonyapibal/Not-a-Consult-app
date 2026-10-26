"use client";

import type { TreeNode } from "@/frameworks/types";
import { useT } from "@/lib/i18n/client";

const MAX_DEPTH = 3;
const newNodeId = () => Math.random().toString(36).slice(2, 10);
const emptyRoot = (): TreeNode => ({ id: "root", text: "", children: [] });

function updateNode(node: TreeNode, id: string, fn: (n: TreeNode) => TreeNode): TreeNode {
  if (node.id === id) return fn(node);
  return { ...node, children: node.children.map((c) => updateNode(c, id, fn)) };
}

function removeNode(node: TreeNode, id: string): TreeNode {
  return { ...node, children: node.children.filter((c) => c.id !== id).map((c) => removeNode(c, id)) };
}

export function TreeInput({
  value,
  onChange,
  readOnly,
}: {
  value: TreeNode | null;
  onChange: (value: TreeNode) => void;
  readOnly?: boolean;
}) {
  const root = value ?? emptyRoot();
  const set = (next: TreeNode) => onChange(next);

  return (
    <div className="rounded-lg border border-line bg-card p-3">
      <NodeEditor
        node={root}
        depth={0}
        readOnly={readOnly}
        onText={(id, text) => set(updateNode(root, id, (n) => ({ ...n, text })))}
        onAdd={(id) => set(updateNode(root, id, (n) => ({ ...n, children: [...n.children, { id: newNodeId(), text: "", children: [] }] })))}
        onRemove={(id) => set(removeNode(root, id))}
      />
    </div>
  );
}

function NodeEditor({
  node,
  depth,
  readOnly,
  onText,
  onAdd,
  onRemove,
}: {
  node: TreeNode;
  depth: number;
  readOnly?: boolean;
  onText: (id: string, text: string) => void;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useT();
  return (
    <div className={depth > 0 ? "relative mt-1.5 border-l border-line pl-4" : undefined}>
      <div className="group flex items-center gap-2">
        <input
          value={node.text}
          readOnly={readOnly}
          onChange={(e) => onText(node.id, e.target.value)}
          placeholder={depth === 0 ? "…" : ""}
          aria-label={`level ${depth}`}
          className={`h-9 min-w-0 flex-1 rounded-md border border-line px-2.5 text-sm focus:border-accent focus:outline-none ${
            depth === 0 ? "font-semibold" : ""
          }`}
        />
        {!readOnly && depth < MAX_DEPTH && (
          <button
            type="button"
            onClick={() => onAdd(node.id)}
            className="shrink-0 rounded px-2 py-1 text-xs text-accent hover:bg-accent-soft"
          >
            + {depth === 0 ? t("ws.addBranch") : t("ws.addChild")}
          </button>
        )}
        {!readOnly && depth > 0 && (
          <button
            type="button"
            onClick={() => onRemove(node.id)}
            className="shrink-0 rounded px-1.5 text-faint opacity-60 hover:text-err group-hover:opacity-100"
            aria-label={t("common.remove")}
          >
            ✕
          </button>
        )}
      </div>
      {node.children.map((child) => (
        <NodeEditor
          key={child.id}
          node={child}
          depth={depth + 1}
          readOnly={readOnly}
          onText={onText}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
