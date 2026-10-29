"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, FileSpreadsheet, Info, Menu, ScanSearch, X } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/analyze", label: "Analyzer", Icon: ScanSearch },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/batch", label: "Batch CSV", Icon: FileSpreadsheet },
  { href: "/about", label: "Methodology", Icon: Info },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-ivory/95 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)} aria-label="TruthLens AI home">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-sage font-serif text-lg text-paper" aria-hidden>T</span>
          <span className="leading-tight">
            <span className="block font-serif text-[19px]">TruthLens AI</span>
            <span className="block text-[11px] text-ink-muted">News classifier · data analytics project</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map(({ href, label, Icon }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link href={href} aria-current={active ? "page" : undefined}
                    className={clsx("relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                      active ? "text-sage" : "text-ink-muted hover:text-ink")}>
                    <Icon size={15} aria-hidden /> {label}
                    {active && <span className="absolute inset-x-3 -bottom-[13px] h-[2px] bg-sage" aria-hidden />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button type="button" className="rounded-md p-2 text-ink md:hidden" aria-expanded={open} aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-rule bg-ivory md:hidden">
          <ul className="container-page py-2">
            {links.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? "page" : undefined}
                  className={clsx("flex items-center gap-3 border-b border-rule/60 py-3.5 text-[15px]", pathname === href ? "text-sage" : "text-ink")}>
                  <Icon size={17} aria-hidden /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
