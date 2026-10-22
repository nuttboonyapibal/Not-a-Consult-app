import { list, str, tree } from "@/frameworks/helpers";
import type { TreeNode } from "@/frameworks/types";
import { Box, Bullets, EMPTY, fieldLabel, type ViewProps } from "./shared";

function Node({ node, depth }: { node: TreeNode; depth: number }) {
  return (
    <div className="flex items-center">
      <div
        className={`shrink-0 rounded-lg border px-3 py-2 text-sm leading-snug ${
          depth === 0 ? "w-48 border-ink bg-ink font-semibold text-white" : depth === 1 ? "w-44 border-accent/30 bg-accent-soft font-medium" : "w-40 border-line bg-card"
        }`}
      >
        {node.text || "…"}
      </div>
      {node.children.length > 0 && (
        <>
          <div className="h-px w-5 shrink-0 bg-line" />
          <div className="relative flex flex-col gap-2 border-l border-line py-1 pl-5">
            {node.children.map((c) => (
              <div key={c.id} className="relative">
                <div className="absolute top-1/2 -left-5 h-px w-5 bg-line" />
                <Node node={c} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function TreeView({ def, data, lang }: ViewProps) {
  const root = tree(data, "tree");
  const question = str(data, "rootQuestion");
  return (
    <div className="space-y-4">
      {question && <p className="text-lg font-medium">{question}</p>}
      <div className="overflow-x-auto rounded-xl border border-line bg-card p-4">
        {root && (root.text || root.children.length) ? <Node node={root} depth={0} /> : <p className="text-sm text-faint italic">{EMPTY[lang]}</p>}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Box title={fieldLabel(def, "focusBranches", lang)}>
          <Bullets items={list(data, "focusBranches")} lang={lang} />
        </Box>
        <Box title={fieldLabel(def, "cutBranches", lang)}>
          <Bullets items={list(data, "cutBranches")} lang={lang} />
        </Box>
      </div>
    </div>
  );
}
