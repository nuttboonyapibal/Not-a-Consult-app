"use client";

import { fieldOrder } from "@/frameworks/registry";
import type { CanvasBoard, CellTone, FieldDef } from "@/frameworks/types";
import { FieldBody } from "../canvas/field-body";
import { Region } from "../canvas/region";
import { TagLegend } from "../canvas/tag-legend";
import { cn } from "../ui";
import type { ViewProps } from "./shared";

// Opaque tints: the grid's gap color must not show through the cells.
const toneStyle: Record<CellTone, string> = {
  neutral: "bg-card",
  accent: "bg-[color-mix(in_oklab,var(--color-accent-soft)_55%,white)]",
  ok: "bg-[color-mix(in_oklab,var(--color-ok-soft)_70%,white)]",
  warn: "bg-[color-mix(in_oklab,var(--color-warn-soft)_70%,white)]",
  err: "bg-[color-mix(in_oklab,var(--color-err-soft)_60%,white)]",
};

/**
 * Grid canvas shared by BMC, Lean Canvas, 2×2 matrices and the multi-box
 * frameworks. Phones get one column in the suggested filling order.
 */
export function CanvasView(props: ViewProps) {
  const { def, data, lang, edit } = props;
  const spec = def.canvas!;
  const order = fieldOrder(def);
  const fields = new Map(def.steps.flatMap((s) => s.fields).map((f) => [f.key, f]));
  return (
    <div className="space-y-5">
      {spec.linkAnchor && <TagLegend def={def} data={data} lang={lang} edit={edit} />}
      {spec.boards.map((board, i) => (
        <Board key={i} board={board} props={props} order={order} fields={fields} />
      ))}
    </div>
  );
}

function Board({
  board,
  props,
  order,
  fields,
}: {
  board: CanvasBoard;
  props: ViewProps;
  order: string[];
  fields: Map<string, FieldDef>;
}) {
  const { data, lang, edit } = props;
  const rank = (keys: string[]) => Math.min(...keys.map((k) => order.indexOf(k)));
  const cells = [...board.cells].sort((a, b) => rank(a.fields) - rank(b.fields));
  const style = {
    "--cols": `repeat(${board.columns}, minmax(0, 1fr))`,
    "--areas": board.areas.map((r) => `"${r}"`).join(" "),
  } as React.CSSProperties;

  const grid = (
    <div
      style={style}
      className={cn(
        "grid grid-cols-1 md:[grid-template-areas:var(--areas)] md:[grid-template-columns:var(--cols)]",
        board.cards ? "gap-3" : "gap-px overflow-hidden rounded-xl border border-line bg-line",
      )}
    >
      {cells.map((cell) => {
        const many = cell.fields.length > 1;
        return (
          <div
            key={cell.area}
            style={{ "--area": cell.area } as React.CSSProperties}
            className={cn(
              "min-h-24 p-3 md:[grid-area:var(--area)]",
              toneStyle[cell.tone ?? "neutral"],
              board.cards && "rounded-xl border border-line",
            )}
          >
            {many && cell.title && <div className="mb-2 text-sm font-semibold">{cell.title[lang]}</div>}
            <div className={cn(many && "space-y-3")}>
              {cell.fields.map((key) => {
                const f = fields.get(key);
                if (!f) return null;
                return (
                  <Region key={key} fieldKey={key} label={(many && cell.title && f.short ? f.short : f.label)[lang]} edit={edit}>
                    <FieldBody field={f} value={data[key]} edit={edit} lang={lang} activeTag={edit?.activeTag} />
                  </Region>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <section className="space-y-2">
      {board.title && <h4 className="text-sm font-semibold">{board.title[lang]}</h4>}
      {board.axes ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1.5rem_minmax(0,1fr)]">
          <div className="hidden flex-col text-[11px] font-medium text-muted md:flex">
            {board.axes.y.map((label, i) => (
              <span key={i} className="flex flex-1 items-center justify-center [writing-mode:vertical-rl] rotate-180">
                {label[lang]}
              </span>
            ))}
          </div>
          <div>
            {grid}
            <div className="mt-1.5 hidden grid-cols-2 text-center text-[11px] font-medium text-muted md:grid">
              {board.axes.x.map((label, i) => (
                <span key={i}>{label[lang]}</span>
              ))}
            </div>
            {(board.axes.xTitle || board.axes.yTitle) && (
              <p className="mt-1 hidden text-center text-[11px] text-faint md:block">
                {[board.axes.yTitle?.[lang], board.axes.xTitle?.[lang]].filter(Boolean).join(" × ")}
              </p>
            )}
          </div>
        </div>
      ) : (
        grid
      )}
    </section>
  );
}
