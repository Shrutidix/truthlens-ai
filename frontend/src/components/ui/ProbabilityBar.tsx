import { pct } from "@/lib/format";

export default function ProbabilityBar({ real, fake }: { real: number; fake: number }) {
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-linen" role="img"
        aria-label={`REAL probability ${pct(real)}, FAKE probability ${pct(fake)}`}>
        <div className="h-full bg-sage transition-[width] duration-500" style={{ width: `${real * 100}%` }} />
        <div className="h-full bg-clay/70 transition-[width] duration-500" style={{ width: `${fake * 100}%` }} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
        <div><dt className="flex items-center gap-2 text-ink-muted"><span className="h-2.5 w-2.5 rounded-sm bg-sage" aria-hidden />REAL</dt>
          <dd className="font-mono text-lg">{pct(real)}</dd></div>
        <div><dt className="flex items-center gap-2 text-ink-muted"><span className="h-2.5 w-2.5 rounded-sm bg-clay/70" aria-hidden />FAKE</dt>
          <dd className="font-mono text-lg">{pct(fake)}</dd></div>
      </dl>
    </div>
  );
}
