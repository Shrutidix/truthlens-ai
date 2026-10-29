import { AlertTriangle, Info, Loader2 } from "lucide-react";
import clsx from "clsx";

export function Disclaimer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="note" className={clsx("flex gap-3 rounded-lg border border-amber/20 bg-amber-soft px-4 py-3 text-sm text-amber", className)}>
      <Info size={17} className="mt-0.5 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function ErrorMessage({ title = "Something went wrong", children, onRetry }: { title?: string; children: React.ReactNode; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex gap-3 rounded-lg border border-clay/25 bg-clay-soft px-4 py-3 text-sm text-clay">
      <AlertTriangle size={17} className="mt-0.5 shrink-0" aria-hidden />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5">{children}</p>
        {onRetry && <button onClick={onRetry} className="mt-2 underline underline-offset-2 hover:no-underline">Try again</button>}
      </div>
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 text-sm text-ink-muted">
      <Loader2 size={16} className="animate-spin" aria-hidden /> {label}
    </div>
  );
}
