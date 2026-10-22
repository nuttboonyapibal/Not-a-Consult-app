import { list, str } from "@/frameworks/helpers";
import { Bullets, EMPTY, type ViewProps } from "./shared";

const WORDS = {
  play: { th: "เล่น", en: "Play" },
  notPlay: { th: "ไม่เล่น", en: "Don't play" },
};

export function CascadeView({ def, data, lang }: ViewProps) {
  const text = (key: string) => str(data, key) || <span className="text-faint italic">{EMPTY[lang]}</span>;
  const steps = def.steps;
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={step.id} className="relative">
          <div className="rounded-xl border border-line bg-card p-4" style={{ marginLeft: `${Math.min(i, 4) * 12}px` }}>
            <div className="mb-2 text-sm font-semibold">{step.title[lang]}</div>
            {step.id === "aspiration" && <p className="text-base leading-relaxed">{text("aspiration")}</p>}
            {step.id === "where" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-ok-soft/70 p-3">
                  <div className="mb-1 text-xs font-semibold text-ok">{WORDS.play[lang]}</div>
                  <Bullets items={list(data, "whereToPlay")} lang={lang} />
                </div>
                <div className="rounded-lg bg-err-soft/60 p-3">
                  <div className="mb-1 text-xs font-semibold text-err">{WORDS.notPlay[lang]}</div>
                  <Bullets items={list(data, "whereNotToPlay")} lang={lang} />
                </div>
              </div>
            )}
            {step.id === "how" && <p className="text-sm leading-relaxed">{text("howToWin")}</p>}
            {step.id === "capabilities" && <Bullets items={list(data, "capabilities")} lang={lang} />}
            {step.id === "systems" && <Bullets items={list(data, "systems")} lang={lang} />}
          </div>
        </li>
      ))}
    </ol>
  );
}
