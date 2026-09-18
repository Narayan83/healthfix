import { useState } from "react";
import { fetchPromotionStockReport } from "./ReportsService";
import { reportErrorMessage } from "./reportError";

export default function PromotionStockReport() {
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (searchTerm = filter) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetchPromotionStockReport(searchTerm);
      setRows(res.data.data || []);
    } catch (err) {
      setError(reportErrorMessage(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="hf-report-filters d-flex flex-wrap align-items-end gap-2 mb-3">
        <div className="flex-grow-1" style={{ maxWidth: 320 }}>
          <label className="form-label small mb-1">Search item</label>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Promotion item name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), setFilter(search), load())}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setFilter(search);
            load(search);
          }}
          disabled={loading}
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </div>
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="table-responsive">
        <table className="table table-sm table-hover">
          <thead>
            <tr>
              <th>Promotion item</th>
              <th className="text-end">Stock qty</th>
              <th className="text-end">Stock value</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={3} className="text-muted text-center">
                  Click Load to view stock balances.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.promotion_item_id}>
                <td>{r.item_name}</td>
                <td className="text-end">{r.balance_quantity}</td>
                <td className="text-end">{r.balance_value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
