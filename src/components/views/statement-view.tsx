import { list, num, str } from "@/frameworks/helpers";
import { Box, Bullets, EMPTY, fieldLabel, type ViewProps } from "./shared";

const WORDS = {
  when: { th: "เมื่อ", en: "When" },
  want: { th: "ฉันอยากจะ", en: "I want to" },
  so: { th: "เพื่อที่จะ", en: "so I can" },
  interviews: { th: "คุยกับลูกค้า", en: "Customers interviewed" },
  people: { th: "คน", en: "" },
};

function Part({ label, text, lang }: { label: string; text: string; lang: "th" | "en" }) {
  return (
    <>
      <span className="text-white/55">{label} </span>
      <span className={text ? "text-white" : "text-white/35 italic"}>{text || EMPTY[lang]}</span>{" "}
    </>
  );
}

export function StatementView({ def, data, lang }: ViewProps) {
  const interviews = num(data, "interviews");
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-ink p-6 sm:p-8">
        {str(data, "customer") && <div className="mb-3 text-sm text-white/60">{str(data, "customer")}</div>}
        <p className="text-xl leading-relaxed font-medium sm:text-2xl">
          <Part label={WORDS.when[lang]} text={str(data, "situation")} lang={lang} />
          <Part label={WORDS.want[lang]} text={str(data, "motivation")} lang={lang} />
          <Part label={WORDS.so[lang]} text={str(data, "outcome")} lang={lang} />
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {["functional", "emotional", "social"].map((key) => (
          <Box key={key} title={fieldLabel(def, key, lang)}>
            <p className="text-sm leading-relaxed">{str(data, key) || <span className="text-faint italic">{EMPTY[lang]}</span>}</p>
          </Box>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_200px]">
        <Box title={fieldLabel(def, "alternatives", lang)}>
          <Bullets items={list(data, "alternatives")} lang={lang} />
        </Box>
        <Box title={WORDS.interviews[lang]}>
          <div className="text-3xl font-semibold tabular-nums">
            {interviews ?? "—"} <span className="text-base font-normal text-muted">{WORDS.people[lang]}</span>
          </div>
        </Box>
      </div>
    </div>
  );
}
