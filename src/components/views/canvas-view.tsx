import { list, str } from "@/frameworks/helpers";
import { Bullets, fieldLabel, type ViewProps } from "./shared";

export function CanvasView({ def, data, lang }: ViewProps) {
  const canvas = def.canvas!;
  const areas = [...new Set(canvas.areas.join(" ").split(/\s+/))];
  const fit = str(data, "fitStory");
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div
          className="grid min-w-[760px] gap-px overflow-hidden rounded-xl border border-line bg-line"
          style={{
            gridTemplateColumns: `repeat(${canvas.columns}, minmax(0, 1fr))`,
            gridTemplateAreas: canvas.areas.map((r) => `"${r}"`).join(" "),
          }}
        >
          {areas.map((key) => (
            <div key={key} className="min-h-32 bg-card p-3" style={{ gridArea: key }}>
              <div className="mb-2 text-xs font-semibold text-muted">{fieldLabel(def, key, lang)}</div>
              <Bullets items={list(data, key)} lang={lang} className="text-[13px]" />
            </div>
          ))}
        </div>
      </div>
      {fit && (
        <div className="rounded-xl border border-line bg-card p-4">
          <div className="mb-1 text-xs font-semibold text-muted">{fieldLabel(def, "fitStory", lang)}</div>
          <p className="text-sm leading-relaxed">{fit}</p>
        </div>
      )}
    </div>
  );
}
