import type { FrameworkDef, FrameworkMeta } from "../types";

export type * from "../types";

/** The structured part of a framework; the registry merges it with catalog metadata. */
export type StructuredDef = { key: string } & Omit<FrameworkDef, keyof FrameworkMeta | "structured">;
