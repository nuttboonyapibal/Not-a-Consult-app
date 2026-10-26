"use client";

import { str } from "@/frameworks/helpers";
import { Slot, type ViewProps } from "./shared";

export function TreeView(view: ViewProps) {
  const { data, edit } = view;
  const question = str(data, "rootQuestion");
  return (
    <div className="space-y-4">
      {edit ? (
        <Slot view={view} field="rootQuestion" />
      ) : (
        question && <p className="text-lg font-medium">{question}</p>
      )}
      <div className="rounded-xl border border-line bg-card p-4">
        <Slot view={view} field="tree" hideLabel={!edit} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-card p-4">
          <Slot view={view} field="focusBranches" />
        </div>
        <div className="rounded-xl border border-line bg-card p-4">
          <Slot view={view} field="cutBranches" />
        </div>
      </div>
    </div>
  );
}
