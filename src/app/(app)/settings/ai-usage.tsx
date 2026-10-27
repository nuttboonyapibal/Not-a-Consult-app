import type { Lang } from "@/frameworks/types";
import { Card } from "@/components/ui";
import type { Database } from "@/lib/database.types";
import { estimateCostUsd } from "@/lib/ai/pricing";
import { UI, type UiKey } from "@/lib/i18n/ui";
import { displayName } from "@/lib/auth/username";
import type { Profile } from "@/lib/types";

type UsageRow = Database["public"]["Functions"]["ai_usage_summary"]["Returns"][number];

interface Totals {
  requests: number;
  failed: number;
  input: number;
  output: number;
  cost: number;
  unpriced: boolean;
}

function add(into: Totals, r: UsageRow) {
  const cost = estimateCostUsd(r);
  into.requests += r.requests;
  into.failed += r.failed;
  into.input += r.input_tokens + r.cache_read_tokens;
  into.output += r.output_tokens;
  into.cost += cost ?? 0;
  into.unpriced ||= cost === null;
}

const empty = (): Totals => ({ requests: 0, failed: 0, input: 0, output: 0, cost: 0, unpriced: false });

/** Requests, tokens and an estimated cost per member for the last 30 days. */
export function AiUsage({ rows, people, lang }: { rows: UsageRow[]; people: Profile[]; lang: Lang }) {
  const t = (key: UiKey) => UI[key][lang];
  const num = (n: number) => n.toLocaleString(lang === "th" ? "th-TH" : "en-US");
  const usd = (n: number) => (n > 0 && n < 0.01 ? "< $0.01" : `$${n.toFixed(2)}`);

  const total = empty();
  const byUser = new Map<string, Totals>();
  for (const r of rows) {
    add(total, r);
    const key = r.user_id ?? "";
    if (!byUser.has(key)) byUser.set(key, empty());
    add(byUser.get(key)!, r);
  }
  const name = (id: string) => {
    const p = people.find((x) => x.id === id);
    return p ? displayName(p) : t("settings.aiFormerMember");
  };

  return (
    <Card className="max-w-4xl overflow-hidden">
      <div className="border-b border-line px-6 py-4">
        <div className="font-semibold">{t("settings.aiUsage")}</div>
        <p className="mt-1 text-xs text-muted">{t("settings.aiUsageHelp")}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-6 py-4 text-sm text-muted">{t("settings.aiNone")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-xs text-muted">
              <tr>
                <th className="px-6 py-2 font-medium">{t("settings.members")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("settings.aiRequests")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("settings.aiTokensIn")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("settings.aiTokensOut")}</th>
                <th className="px-6 py-2 text-right font-medium">{t("settings.aiCost")}</th>
              </tr>
            </thead>
            <tbody>
              {[...byUser.entries()]
                .sort((a, b) => b[1].cost - a[1].cost)
                .map(([id, u]) => (
                  <tr key={id} className="border-t border-line">
                    <td className="px-6 py-2.5 font-medium">{name(id)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {num(u.requests)}
                      {u.failed > 0 && <span className="ml-1 text-xs text-err">({num(u.failed)} {t("settings.aiFailed")})</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{num(u.input)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{num(u.output)}</td>
                    <td className="px-6 py-2.5 text-right tabular-nums">{usd(u.cost)}</td>
                  </tr>
                ))}
              <tr className="border-t border-line bg-paper font-semibold">
                <td className="px-6 py-2.5">{t("settings.aiTotal")}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{num(total.requests)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{num(total.input)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{num(total.output)}</td>
                <td className="px-6 py-2.5 text-right tabular-nums">{usd(total.cost)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {total.unpriced && <p className="border-t border-line px-6 py-3 text-xs text-muted">{t("settings.aiUnpriced")}</p>}
    </Card>
  );
}
