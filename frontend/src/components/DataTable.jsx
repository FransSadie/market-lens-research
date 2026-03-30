import { formatDecimal, formatPercent } from "../lib/formatters";
import { EmptyState } from "./EmptyState";

function cellToneClass(value, tone) {
  if (tone === "percent") {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      if (numeric > 0) return "text-good";
      if (numeric < 0) return "text-bad";
    }
  }
  return "text-ink";
}

export function DataTable({ columns, rows, emptyTitle = "Nothing here", emptyMessage = "No rows available.", dense = false }) {
  if (!rows?.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line/90 bg-bg/55 shadow-pane-edge">
      <div className="overflow-auto">
        <table className="w-full min-w-[580px] text-sm">
          <thead className="bg-plate/92 text-mute">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-4 ${dense ? 'py-2.5' : 'py-3.5'} text-${col.align === 'right' ? 'right' : 'left'} text-[11px] font-medium uppercase tracking-[0.16em]`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id || row.ticker || idx}
                className={`border-t border-line/80 transition-colors ${idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'} hover:bg-accent/[0.07]`}
              >
                {columns.map((col) => {
                  const value = row[col.key];
                  let content = value;
                  if (col.render) {
                    content = col.render(value, row);
                  } else if (col.format === "percent") {
                    content = formatPercent(value);
                  } else if (col.format === "decimal") {
                    content = formatDecimal(value, col.digits ?? 2);
                  }
                  return (
                    <td key={col.key} className={`px-4 ${dense ? 'py-2.5' : 'py-3'} text-${col.align === 'right' ? 'right' : 'left'} ${col.emphasis ? 'font-semibold text-ink' : cellToneClass(value, col.tone)}`}>
                      <span className={value == null ? "text-mute" : ""}>{content ?? "--"}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
