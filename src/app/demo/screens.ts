export const SCREENS = ["wizard", "workspace", "fill", "summary", "report"] as const;
export type Screen = (typeof SCREENS)[number];
