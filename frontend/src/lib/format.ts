export const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;
export const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;
