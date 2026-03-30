import { formatTimestamp } from "../lib/formatters";

export function TimestampLabel({ label = "Updated", value, className = "" }) {
  return <div className={`text-xs text-mute ${className}`}>{label}: {formatTimestamp(value)}</div>;
}
