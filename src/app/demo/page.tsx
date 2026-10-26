import { notFound } from "next/navigation";
import { getFramework } from "@/frameworks/registry";
import { Demo } from "./demo";
import { SCREENS, type Screen } from "./screens";

export const metadata = { title: "Demo" };

// Walks through the real screens with fictional data and no database.
// Only available in development.
export default async function DemoPage({ searchParams }: PageProps<"/demo">) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { screen, fw, empty } = await searchParams;
  const current = SCREENS.includes(screen as Screen) ? (screen as Screen) : "wizard";
  const key = typeof fw === "string" && getFramework(fw) ? fw : "unit-economics";
  return <Demo screen={current} fw={key} empty={empty === "1"} />;
}
