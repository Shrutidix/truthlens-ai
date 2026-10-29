import { CheckCircle2, ShieldAlert } from "lucide-react";
import clsx from "clsx";
import type { Label } from "@/types/api";

/** Colour is never the only cue: icon + word are always shown. */
export default function LabelBadge({ label, size = "md" }: { label: Label; size?: "sm" | "md" | "lg" }) {
  const real = label === "REAL";
  const Icon = real ? CheckCircle2 : ShieldAlert;
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-md border font-medium",
      real ? "border-sage/25 bg-sage-soft text-[#34493c]" : "border-clay/25 bg-clay-soft text-clay",
      size === "sm" && "px-2 py-0.5 text-xs", size === "md" && "px-2.5 py-1 text-sm", size === "lg" && "px-3.5 py-1.5 text-base")}>
      <Icon size={size === "lg" ? 18 : 14} aria-hidden /> {label}
    </span>
  );
}
