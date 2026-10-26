"use client";

import { PROFILE_FIELDS } from "@/frameworks/profile";
import type { Data } from "@/frameworks/types";
import { FieldInput } from "@/components/fields/field-input";
import { SaveIndicator } from "@/components/fields/save-indicator";
import { useAutosave } from "@/components/fields/use-autosave";
import { patchProfile } from "@/lib/actions/projects";

export function ProfileForm({ projectId, initial }: { projectId: string; initial: Data }) {
  const { data, setField, state } = useAutosave(initial, (patch) => patchProfile(projectId, patch));
  return (
    <div className="space-y-6">
      {PROFILE_FIELDS.map((field) => (
        <FieldInput key={field.key} field={field} value={data[field.key]} onChange={(v) => setField(field.key, v)} />
      ))}
      <div className="flex justify-end">
        <SaveIndicator state={state} />
      </div>
    </div>
  );
}
