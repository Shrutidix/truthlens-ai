import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-rule bg-linen/60">
      <div className="container-page grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-serif text-xl">TruthLens AI</p>
          <p className="mt-2 max-w-sm text-sm text-ink-muted">
            A college data-analytics project: a scikit-learn pipeline served through FastAPI.
            Predictions are statistical text classifications, not fact-checks.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-3">Explore</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-sage" href="/analyze">Live analyzer</Link></li>
            <li><Link className="hover:text-sage" href="/batch">Batch CSV analysis</Link></li>
            <li><Link className="hover:text-sage" href="/analytics">Model analytics</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-3">Read</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-sage" href="/about">Methodology &amp; limitations</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-rule py-4 text-center text-xs text-ink-muted">
        Evaluation figures come from a synthetic demo dataset and do not indicate real-world accuracy.
      </div>
    </footer>
  );
}
