import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Notices";
import ModelSnapshot from "@/components/ModelSnapshot";
import Reveal from "@/components/Reveal";

const steps = [
  ["Clean", "Lowercase, strip URLs, HTML and non-letters, then drop stopwords. The headline and body are joined, exactly as in training."],
  ["Vectorize", "TF-IDF over unigrams and bigrams with sublinear term frequency, capped at 5,000 features."],
  ["Classify", "Logistic Regression with balanced class weights returns a probability for REAL and for FAKE."],
  ["Explain", "Each present term’s TF-IDF weight × its learned coefficient shows which words pushed the decision, and which way."],
];

export default function Home() {
  return (
    <>
      <section className="container-page grid items-start gap-12 pb-8 pt-14 md:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <Reveal>
          <p className="eyebrow">Fake news detection · scikit-learn · FastAPI</p>
          <h1 className="mt-4 text-[40px] sm:text-5xl lg:text-[56px]">A news classifier you can actually interrogate.</h1>
          <p className="mt-6 max-w-xl text-lg text-ink-muted">
            TruthLens AI runs your text through a TF-IDF + Logistic Regression pipeline and shows the probabilities and the words behind
            each call. It reads writing style, not facts.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/analyze">Analyze News <ArrowRight size={16} aria-hidden /></ButtonLink>
            <ButtonLink href="/analytics" variant="secondary">Explore Model</ButtonLink>
          </div>
          <p className="mt-6 max-w-md text-sm text-ink-muted">
            Also: <a className="underline underline-offset-2 hover:text-sage" href="/batch">classify a whole CSV</a> and download the results.
          </p>
        </Reveal>
        <Reveal delay={0.1}><ModelSnapshot /></Reveal>
      </section>

      <section className="container-page mt-24 grid gap-10 border-t border-rule pt-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">The pipeline</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">Four steps, one saved artifact.</h2>
          <p className="mt-4 max-w-sm text-ink-muted">Vectorizer and classifier live in a single scikit-learn Pipeline, so inference uses exactly what training fitted.</p>
        </div>
        <ol className="divide-y divide-rule border-y border-rule">
          {steps.map(([t, d], i) => (
            <li key={t} className="grid grid-cols-[48px_1fr] gap-2 py-5 sm:grid-cols-[64px_160px_1fr]">
              <span className="font-mono text-sm text-sage">0{i + 1}</span>
              <span className="font-serif text-xl">{t}</span>
              <span className="col-span-2 text-[15px] text-ink-muted sm:col-span-1">{d}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page mt-24">
        <div className="card grid gap-8 bg-linen/60 p-8 md:grid-cols-2 md:p-10">
          <div>
            <p className="eyebrow">Methodology &amp; outcome</p>
            <h2 className="mt-3 text-3xl">Perfect scores, read with care.</h2>
          </div>
          <div className="space-y-4 text-[15px] text-ink/90">
            <p>The bundled 400-row dataset is generated from sentence templates. The model scores 100% on its held-out split because the test sentences share templates with the training sentences.</p>
            <p>That says the pipeline works end to end. It does not say the classifier would hold up on real articles. Swap in a real labeled corpus and retrain to measure that.</p>
            <a href="/about" className="inline-flex items-center gap-1.5 text-sm text-sage underline underline-offset-4">Read the full methodology <ArrowRight size={14} aria-hidden /></a>
          </div>
        </div>
      </section>

      <section className="container-page mt-16">
        <Disclaimer>
          <b>Responsible use.</b> A prediction is a statistical pattern match on wording. It is not verification that a claim is true or false, and should never be the sole basis for judging a news story.
        </Disclaimer>
      </section>
    </>
  );
}
