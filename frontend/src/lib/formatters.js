export function formatTimestamp(value) {
  if (!value) return "Never";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export function formatPercent(value, digits = 2) {
  if (value == null || Number.isNaN(Number(value))) return "--";
  return `${(Number(value) * 100).toFixed(digits)}%`;
}

export function formatDecimal(value, digits = 2) {
  if (value == null || Number.isNaN(Number(value))) return "--";
  return Number(value).toFixed(digits);
}

export function formatInteger(value) {
  if (value == null || Number.isNaN(Number(value))) return "--";
  return Number(value).toLocaleString();
}
