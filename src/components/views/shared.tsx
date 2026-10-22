import type { Data, FrameworkDef, Lang } from "@/frameworks/types";
import { cn } from "../ui";

export interface ViewProps {
  def: FrameworkDef;
  data: Data;
  lang: Lang;
}

export const EMPTY = { th: "ยังไม่ได้กรอก", en: "Not filled yet" };

export function Bullets({ items, lang, className }: { items: string[]; lang: Lang; className?: string }) {
  if (items.length === 0) return <p className="text-sm text-faint italic">{EMPTY[lang]}</p>;
  return (
    <ul className={cn("space-y-1 text-sm leading-snug", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-1.5">
          <span className="text-faint">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function Box({ title, children, className }: { title: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-line bg-card p-4", className)}>
      <div className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{title}</div>
      {children}
    </div>
  );
}

export function fieldLabel(def: FrameworkDef, key: string, lang: Lang) {
  for (const step of def.steps) {
    const field = step.fields.find((f) => f.key === key);
    if (field) return field.label[lang];
  }
  return key;
}
