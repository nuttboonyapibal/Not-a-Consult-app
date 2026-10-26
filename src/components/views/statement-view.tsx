"use client";

import { num, str } from "@/frameworks/helpers";
import { InlineText } from "../canvas/inline-inputs";
import { Region } from "../canvas/region";
import { EMPTY, fieldLabel, Slot, type ViewProps } from "./shared";

const WORDS = {
  when: { th: "เมื่อ", en: "When" },
  want: { th: "ฉันอยากจะ", en: "I want to" },
  so: { th: "เพื่อที่จะ", en: "so I can" },
  people: { th: "คน", en: "people" },
};

const PARTS = [
  { key: "situation", word: WORDS.when },
  { key: "motivation", word: WORDS.want },
  { key: "outcome", word: WORDS.so },
] as const;

export function StatementView(view: ViewProps) {
  const { def, data, lang, edit } = view;
  const interviews = num(data, "interviews");
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-ink p-6 sm:p-8">
        {edit ? (
          <div className="space-y-3">
            <Region fieldKey="customer" label={fieldLabel(def, "customer", lang)} edit={edit} hideLabel>
              <InlineText
                singleLine
                value={str(data, "customer")}
                onChange={(v) => edit.onChange("customer", v)}
                placeholder={fieldLabel(def, "customer", lang)}
                label={fieldLabel(def, "customer", lang)}
                className="text-sm text-white/70 placeholder:text-white/35 focus:bg-white/10"
              />
            </Region>
            {PARTS.map(({ key, word }) => (
              <Region key={key} fieldKey={key} label={fieldLabel(def, key, lang)} edit={edit} hideLabel>
                <div className="flex items-start gap-2">
                  <span className="pt-1.5 text-lg whitespace-nowrap text-white/55 sm:text-xl">{word[lang]}</span>
                  <InlineText
                    value={str(data, key)}
                    onChange={(v) => edit.onChange(key, v)}
                    placeholder="…"
                    label={fieldLabel(def, key, lang)}
                    className="text-lg font-medium text-white placeholder:text-white/35 focus:bg-white/10 sm:text-xl"
                  />
                </div>
              </Region>
            ))}
          </div>
        ) : (
          <>
            {str(data, "customer") && <div className="mb-3 text-sm text-white/60">{str(data, "customer")}</div>}
            <p className="text-xl leading-relaxed font-medium sm:text-2xl">
              {PARTS.map(({ key, word }) => (
                <span key={key}>
                  <span className="text-white/55">{word[lang]} </span>
                  <span className={str(data, key) ? "text-white" : "text-white/35 italic"}>{str(data, key) || EMPTY[lang]}</span>{" "}
                </span>
              ))}
            </p>
          </>
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {["functional", "emotional", "social"].map((key) => (
          <div key={key} className="rounded-xl border border-line bg-card p-4">
            <Slot view={view} field={key} />
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="rounded-xl border border-line bg-card p-4">
          <Slot view={view} field="alternatives" />
        </div>
        <div className="rounded-xl border border-line bg-card p-4">
          {edit ? (
            <Slot view={view} field="interviews" />
          ) : (
            <>
              <div className="mb-1.5 text-xs font-semibold text-muted">{fieldLabel(def, "interviews", lang)}</div>
              <div className="text-3xl font-semibold tabular-nums">
                {interviews ?? "—"} <span className="text-base font-normal text-muted">{WORDS.people[lang]}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
