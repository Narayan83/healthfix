import { useEffect, useState } from "react";
import ReportDateBar from "./ReportDateBar";
import { yesterdayISO } from "./reportDate";
import { fetchDoctorVisitsReport } from "./ReportsService";
import { reportErrorMessage } from "./reportError";
import { getRepresentativeOptions } from "../RepresentativeMaster/RepresentativeMasterService";

export default function DoctorVisitsReport() {
  const [date, setDate] = useState(yesterdayISO());
  const [representativeId, setRepresentativeId] = useState("");
  const [reps, setReps] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getRepresentativeOptions().then((res) => setReps(res.data.data || []));
  }, []);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetchDoctorVisitsReport(date, representativeId || undefined);
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
        <div>
          <label className="form-label small mb-1">Date</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex-grow-1" style={{ minWidth: 180, maxWidth: 280 }}>
          <label className="form-label small mb-1">Representative (filter)</label>
          <select
            className="form-select form-select-sm"
            value={representativeId}
            onChange={(e) => setRepresentativeId(e.target.value)}
          >
            <option value="">All representatives</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Load"}
        </button>
      </div>
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="table-responsive">
        <table className="table table-sm table-hover">
          <thead>
            <tr>
              <th>Date</th>
              <th>Representative</th>
              <th>Doctor visited</th>
              <th>Area</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="text-muted text-center">
                  No doctor visits for this date.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.entry_date}</td>
                <td>{r.representative_name}</td>
                <td>{r.doctor_name || "—"}</td>
                <td>{r.area_name || "—"}</td>
                <td>{r.remarks || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
