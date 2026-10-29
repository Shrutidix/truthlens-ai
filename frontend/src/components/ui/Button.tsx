import Link from "next/link";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost";
const base = "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";
const variants: Record<Variant, string> = {
  primary: "bg-sage text-paper hover:bg-[#435a4d] active:translate-y-px",
  secondary: "border border-rule bg-paper text-ink hover:border-sage/50 hover:bg-linen",
  ghost: "text-sage hover:bg-sage-soft/60",
};

export function Button({ variant = "primary", loading, children, className, disabled, ...rest }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button {...rest} disabled={disabled || loading} aria-busy={loading || undefined} className={clsx(base, variants[variant], className)}>
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({ href, variant = "primary", children, className }:
  { href: string; variant?: Variant; children: React.ReactNode; className?: string }) {
  return <Link href={href} className={clsx(base, variants[variant], className)}>{children}</Link>;
}
