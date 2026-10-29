export type Label = "REAL" | "FAKE";

export interface FeatureContribution { token: string; contribution: number; direction: Label }
export interface PredictResponse {
  label: Label;
  confidence: number;
  probabilities: { REAL: number; FAKE: number };
  top_features: FeatureContribution[];
}
export interface BatchRow {
  row: number;
  status: "ok" | "skipped";
  reason: string | null;
  label: Label | null;
  confidence: number | null;
  prob_real: number | null;
  prob_fake: number | null;
  data: Record<string, string | null>;
}
export interface BatchResponse {
  columns: string[];
  summary: { total_rows: number; predicted: number; skipped: number; real: number; fake: number };
  rows: BatchRow[];
}
export interface GlobalFeature { token: string; coefficient: number }
export interface ModelInfo {
  name: string;
  architecture: string[];
  label_mapping: Record<Label, number>;
  tfidf_params: Record<string, unknown>;
  logreg_params: Record<string, unknown>;
  split: { test_size: number; random_state: number; stratified: boolean };
  evaluation: {
    source: string;
    confusion_matrix: { labels: Label[]; matrix: number[][]; test_size: number };
    metrics_file: { accuracy: number; precision: number; recall: number; f1_score: number };
    dataset: { rows: number; class_counts: Record<Label, number>; synthetic: boolean; train_rows: number; test_rows: number };
    model: { vocabulary_size: number; top_fake_features: GlobalFeature[]; top_real_features: GlobalFeature[] };
  };
  limits: { max_text_chars: number; max_upload_bytes: number; max_batch_rows: number };
  notice: string;
}
