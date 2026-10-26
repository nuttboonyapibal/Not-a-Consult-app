"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "./ui";

export function NavLink({ href, exact, children }: { href: string; exact?: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn("rounded-lg px-3 py-1.5 transition-colors", active ? "bg-black/5 font-medium text-ink" : "text-muted hover:text-ink")}
    >
      {children}
    </Link>
  );
}

export function TabLink({ href, exact, children }: { href: string; exact?: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "-mb-px border-b-2 px-1 pb-2.5 text-sm whitespace-nowrap transition-colors",
        active ? "border-accent font-medium text-ink" : "border-transparent text-muted hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
