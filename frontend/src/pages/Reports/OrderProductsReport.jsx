import { useState } from "react";
import ReportDateBar from "./ReportDateBar";
import { yesterdayISO } from "./reportDate";
import { fetchOrderProductsReport } from "./ReportsService";
import { reportErrorMessage } from "./reportError";

export default function OrderProductsReport() {
  const [date, setDate] = useState(yesterdayISO());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetchOrderProductsReport(date);
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
      <ReportDateBar date={date} onDateChange={setDate} onLoad={load} loading={loading} />
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="table-responsive">
        <table className="table table-sm table-hover">
          <thead>
            <tr>
              <th>Representative</th>
              <th>Product code</th>
              <th>Product</th>
              <th className="text-end">Qty</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="text-muted text-center">
                  No orders for this date.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={`${r.product_code}-${r.representative_name}-${i}`}>
                <td>{r.representative_name}</td>
                <td>{r.product_code || "—"}</td>
                <td>{r.product_name || "—"}</td>
                <td className="text-end">{r.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
