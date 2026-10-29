export default function Kpi({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="card p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-serif text-4xl text-sage">{value}</p>
      {note && <p className="mt-1 text-xs text-ink-muted">{note}</p>}
    </div>
  );
}
