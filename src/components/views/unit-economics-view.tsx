"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { str } from "@/frameworks/helpers";
import { computeUnitEconomics } from "@/frameworks/defs/unit-economics";
import type { CheckLevel } from "@/frameworks/types";
import { formatMetric } from "@/lib/format";
import { cn } from "../ui";
import { Slot, type ViewProps } from "./shared";

const levelStyle: Record<CheckLevel, string> = {
  ok: "border-ok/30 bg-ok-soft",
  warn: "border-warn/30 bg-warn-soft",
  error: "border-err/30 bg-err-soft",
};
const levelText: Record<CheckLevel, string> = { ok: "text-ok", warn: "text-warn", error: "text-err" };

const WORDS = {
  channel: { th: "ช่องทาง", en: "Channel" },
  spend: { th: "ค่าใช้จ่าย", en: "Spend" },
  customers: { th: "ลูกค้าใหม่", en: "New customers" },
  cac: { th: "CAC", en: "CAC" },
  ratio: { th: "LTV/CAC", en: "LTV/CAC" },
  maxCac: { th: "CAC สูงสุดที่ยังได้ LTV/CAC = 3", en: "Highest CAC that keeps LTV/CAC at 3" },
  chart: { th: "ต้นทุนหาลูกค้าแยกช่องทาง", en: "Acquisition cost by channel" },
};

const INPUTS = ["arpu", "grossMargin", "churn"];

export function UnitEconomicsView(view: ViewProps) {
  const { def, data, lang, edit } = view;
  const metrics = def.metrics?.(data) ?? [];
  const u = computeUnitEconomics(data);
  const maxCac = u.ltv != null ? u.ltv / 3 : null;
  const chartData = u.channels.filter((c) => c.cac != null).map((c) => ({ name: c.name || "—", cac: Math.round(c.cac!), ratio: c.ratio }));
  const scope = [str(data, "segment"), str(data, "period")].filter(Boolean).join(" · ");

  return (
    <div className="space-y-4">
      {edit ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-card p-3">
              <Slot view={view} field="segment" />
            </div>
            <div className="rounded-xl border border-line bg-card p-3">
              <Slot view={view} field="period" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {INPUTS.map((key) => (
              <div key={key} className="rounded-xl border border-line bg-card p-3">
                <Slot view={view} field={key} />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-line bg-card p-3">
            <Slot view={view} field="channels" />
          </div>
        </>
      ) : (
        scope && <div className="text-sm text-muted">{scope}</div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.key} className={cn("rounded-xl border border-line bg-card p-4", m.level && levelStyle[m.level])}>
            <div className="text-xs text-muted">{m.label[lang]}</div>
            <div className={cn("mt-1 text-2xl font-semibold tabular-nums", m.level && levelText[m.level])}>
              {formatMetric(m.value, m.format, lang)}
            </div>
          </div>
        ))}
      </div>
      {u.channels.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-x-auto rounded-xl border border-line bg-card">
            <table className="w-full text-sm">
              <thead className="bg-paper text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">{WORDS.channel[lang]}</th>
                  <th className="px-3 py-2 text-right font-medium">{WORDS.spend[lang]}</th>
                  <th className="px-3 py-2 text-right font-medium">{WORDS.customers[lang]}</th>
                  <th className="px-3 py-2 text-right font-medium">{WORDS.cac[lang]}</th>
                  <th className="px-3 py-2 text-right font-medium">{WORDS.ratio[lang]}</th>
                </tr>
              </thead>
              <tbody>
                {u.channels.map((c, i) => {
                  const level: CheckLevel | null = c.ratio == null ? null : c.ratio >= 3 ? "ok" : c.ratio >= 1 ? "warn" : "error";
                  return (
                    <tr key={i} className="border-t border-line">
                      <td className="px-3 py-2">{c.name || "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMetric(c.spend, "number", lang)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMetric(c.customers, "number", lang)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatMetric(c.cac, "number", lang)}</td>
                      <td className={cn("px-3 py-2 text-right font-semibold tabular-nums", level && levelText[level])}>
                        {formatMetric(c.ratio, "ratio", lang)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {chartData.length > 0 && (
            <div className="rounded-xl border border-line bg-card p-3">
              <div className="mb-2 px-1 text-xs font-medium text-muted">{WORDS.chart[lang]}</div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="#ebe8e2" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#686c75" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#686c75" }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      formatter={(v) => [formatMetric(Number(v), "currency", lang), WORDS.cac[lang]]}
                    />
                    {maxCac != null && (
                      <ReferenceLine y={Math.round(maxCac)} stroke="#1d7f55" strokeDasharray="4 4" label={{ value: WORDS.maxCac[lang], fontSize: 11, fill: "#1d7f55", position: "insideTopRight" }} />
                    )}
                    <Bar dataKey="cac" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={d.ratio != null && d.ratio < 1 ? "#bf3b27" : d.ratio != null && d.ratio < 3 ? "#d4952e" : "#2c47c9"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
