import type { Metadata } from "next";
import { Disclaimer } from "@/components/ui/Notices";

export const metadata: Metadata = { title: "Methodology" };

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-rule py-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
      <div><p className="eyebrow">{eyebrow}</p><h2 className="mt-2 text-2xl sm:text-3xl">{title}</h2></div>
      <div className="prose-ed">{children}</div>
    </section>
  );
}

export default function About() {
  return (
    <div className="container-page pt-12 md:pt-16">
      <p className="eyebrow">About &amp; methodology</p>
      <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl">What this model does, and what it cannot do.</h1>
      <p className="mt-5 max-w-2xl text-lg text-ink-muted">Every technical statement here is taken from the project’s source code (<span className="font-mono text-base">config.py</span>, <span className="font-mono text-base">preprocess.py</span>, <span className="font-mono text-base">train.py</span>, <span className="font-mono text-base">predict.py</span>).</p>

      <div className="mt-10">
        <Section eyebrow="Objective" title="A transparent baseline">
          <p>The goal is a small, explainable text classifier that labels news text REAL or FAKE and shows why. Logistic Regression over TF-IDF features is a standard, interpretable baseline, which is why each prediction can be traced back to individual words.</p>
        </Section>
        <Section eyebrow="Data" title="Preparation">
          <p>If no dataset exists, <span className="font-mono text-sm">data_loader.py</span> generates 400 rows (200 REAL, 200 FAKE) by combining 20 topics with 10 sentence templates per class. Titles and bodies are joined, then cleaned. A stratified 80/20 split with seed 42 produces 320 training and 80 test rows.</p>
        </Section>
        <Section eyebrow="Preprocessing" title="Text cleaning">
          <p>Text is lowercased; URLs and HTML tags are removed; everything except letters is stripped; whitespace is collapsed; then an embedded English stopword list and one-letter tokens are removed. No external downloads are needed.</p>
        </Section>
        <Section eyebrow="Model" title="TF-IDF, Logistic Regression, one Pipeline">
          <p><b>TF-IDF</b> turns each document into weighted counts of unigrams and bigrams (max 5,000 features, min_df 2, max_df 0.9, sublinear tf). <b>Logistic Regression</b> (C=1.0, balanced class weights) learns one coefficient per feature. Both are saved together as one scikit-learn Pipeline, so inference reuses the fitted vocabulary exactly.</p>
          <p>Labels map REAL→0 and FAKE→1. <span className="font-mono text-sm">predict_proba</span> returns the two class probabilities; “confidence” is simply the probability of the predicted class.</p>
        </Section>
        <Section eyebrow="Explanations" title="Feature contributions">
          <p>For an input, each vocabulary term present contributes its TF-IDF value × the term’s coefficient. Positive contributions push toward FAKE, negative toward REAL. This explains the model’s arithmetic, not whether a claim is true.</p>
        </Section>
        <Section eyebrow="Evaluation" title="Why 100% is not a headline">
          <p>All four metrics are 1.0 on the 80-row test split (40 correct REAL, 40 correct FAKE). Because the data comes from a small set of templates, test sentences closely resemble training sentences; the task is far easier than real news. No external dataset, cross-validation or independent validation has been run.</p>
        </Section>
        <Section eyebrow="Risks" title="Bias, distribution shift, and errors">
          <p><b>Bias.</b> The model equates sensational wording with FAKE and measured wording with REAL. Real misinformation can be calm in tone, and legitimate reports can be emphatic.</p>
          <p><b>Distribution shift.</b> Vocabulary outside the 511-term trained vocabulary is ignored, so unfamiliar text may produce confident but meaningless output.</p>
          <p><b>False positives</b> (REAL flagged as FAKE) can unfairly discredit accurate reporting; <b>false negatives</b> (FAKE passed as REAL) can lend false credibility. Neither has been measured on real data here.</p>
        </Section>
        <Section eyebrow="Use" title="Responsible interpretation">
          <p>Treat results as a prompt to look closer, not a verdict. Check claims against primary sources and established fact-checkers. To go further, retrain on a real labeled corpus (e.g. the Kaggle “Fake and Real News” dataset) and compare against held-out, time-split data.</p>
          <Disclaimer>Predictions are not independent verification of factual truth.</Disclaimer>
        </Section>
      </div>
    </div>
  );
}
