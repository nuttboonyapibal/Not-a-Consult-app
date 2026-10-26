// USD per million tokens (Claude API list prices). Cache writes are logged as
// input, so estimates run slightly low; models not listed here get none.
const PRICES: Record<string, { input: number; output: number; cacheRead: number }> = {
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
};

export function estimateCostUsd(r: { model: string; input_tokens: number; output_tokens: number; cache_read_tokens: number }) {
  const p = PRICES[r.model];
  if (!p) return null;
  return (r.input_tokens * p.input + r.output_tokens * p.output + r.cache_read_tokens * p.cacheRead) / 1_000_000;
}
