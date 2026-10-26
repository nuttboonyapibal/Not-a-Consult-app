"use client";

import { useLayoutEffect, useRef } from "react";
import type { Option } from "@/frameworks/types";
import { useT } from "@/lib/i18n/client";
import { cn } from "../ui";

const bare =
  "w-full rounded-md bg-transparent px-1.5 py-1 text-sm text-ink outline-none placeholder:text-faint hover:bg-black/[0.03] focus:bg-card focus:ring-2 focus:ring-accent/30";

/** A textarea that looks like plain text and grows with its content. */
export function InlineText({
  value,
  onChange,
  placeholder,
  singleLine,
  className,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  singleLine?: boolean;
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      aria-label={label}
      placeholder={placeholder}
      onChange={(e) => onChange(singleLine ? e.target.value.replace(/\n/g, " ") : e.target.value)}
      onKeyDown={(e) => {
        if (singleLine && e.key === "Enter" && !e.nativeEvent.isComposing) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className={cn(bare, "block resize-none overflow-hidden leading-relaxed", className)}
    />
  );
}

export function InlineNumber({
  value,
  onChange,
  unit,
  label,
  className,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  unit?: string;
  label?: string;
  className?: string;
}) {
  const { t } = useT();
  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      <input
        type="number"
        inputMode="decimal"
        aria-label={label}
        value={value ?? ""}
        placeholder={t("canvas.number")}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className={cn(bare, "w-28 text-right font-semibold tabular-nums")}
      />
      {unit && <span className="text-xs text-muted">{unit}</span>}
    </span>
  );
}

export function InlineChoice({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  label?: string;
}) {
  const { tx } = useT();
  return (
    <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={(e) => {
            e.stopPropagation();
            onChange(value === o.value ? "" : o.value);
          }}
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
            value === o.value ? "border-ink bg-ink text-white" : "border-line bg-card text-muted hover:border-ink/40 hover:text-ink",
          )}
        >
          {tx(o.label)}
        </button>
      ))}
    </div>
  );
}
