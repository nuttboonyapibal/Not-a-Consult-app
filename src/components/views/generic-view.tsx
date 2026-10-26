import { list, str } from "@/frameworks/helpers";
import { Box, Bullets, EMPTY, fieldLabel, type ViewProps } from "./shared";

export function GenericView({ def, data, lang }: ViewProps) {
  const analysis = str(data, "analysis");
  return (
    <div className="grid gap-3 md:grid-cols-[3fr_2fr]">
      <Box title={fieldLabel(def, "analysis", lang)}>
        {analysis ? <p className="text-sm leading-relaxed whitespace-pre-line">{analysis}</p> : <p className="text-sm text-faint italic">{EMPTY[lang]}</p>}
      </Box>
      <Box title={fieldLabel(def, "keyPoints", lang)}>
        <Bullets items={list(data, "keyPoints")} lang={lang} />
      </Box>
    </div>
  );
}
