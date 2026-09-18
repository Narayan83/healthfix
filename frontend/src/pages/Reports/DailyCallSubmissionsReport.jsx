import { useEffect, useState } from "react";
import ReportDateBar from "./ReportDateBar";
import { yesterdayISO, formatDateDisplay } from "./reportDate";
import { fetchDailyCallRepresentatives, fetchDailyCallDetails } from "./ReportsService";
import { reportErrorMessage } from "./reportError";

function DetailBlock({ report }) {
  const doctor = report.doctor?.full_name;
  const chemist = report.chemist?.name;
  const visit =
    report.visit_type === "doctor" ? doctor : report.visit_type === "chemist" ? chemist : "—";

  return (
    <div className="border rounded p-2 mb-2 bg-white small">
      <div className="d-flex justify-content-between flex-wrap gap-1">
        <strong className="text-capitalize">{report.entry_type}</strong>
        <span className="text-muted">{formatDateDisplay(report.entry_date)}</span>
      </div>
      {report.entry_type === "report" && (
        <>
          <div>Area: {report.area?.name || "—"}</div>
          <div>Visit: {report.visit_type} — {visit || "—"}</div>
          {report.promotion_lines?.length > 0 && (
            <div className="mt-1">
              <span className="fw-semibold">Promotion:</span>
              <ul className="mb-0 ps-3">
                {report.promotion_lines.map((p) => (
                  <li key={p.id}>
                    {p.promotion_item?.item_name || "Item"} — Qty {p.quantity}, Val {p.value}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.order?.lines?.length > 0 && (
            <div className="mt-1">
              <span className="fw-semibold">Orders:</span>
              <ul className="mb-0 ps-3">
                {report.order.lines.map((l) => (
                  <li key={l.id}>
                    {l.product?.product_code} {l.product?.name} — Qty {l.quantity}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      {report.remarks && <div className="mt-1 text-muted">Remarks: {report.remarks}</div>}
    </div>
  );
}

export default function DailyCallSubmissionsReport() {
  const [date, setDate] = useState(yesterdayISO());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = async () => {
    setError("");
    setLoading(true);
    setSelectedUserId(null);
    setDetails(null);
    try {
      const res = await fetchDailyCallRepresentatives(date);
      setRows(res.data.data || []);
    } catch (err) {
      setError(reportErrorMessage(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDetails = async (userId) => {
    setSelectedUserId(userId);
    setDetailLoading(true);
    setDetails(null);
    try {
      const res = await fetchDailyCallDetails(date, userId);
      setDetails(res.data);
    } catch (err) {
      setError(reportErrorMessage(err, "Failed to load details"));
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <ReportDateBar date={date} onDateChange={setDate} onLoad={loadList} loading={loading} />
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="row g-2">
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-header py-2 small fw-semibold">Representatives submitted</div>
            <div className="list-group list-group-flush">
              {rows.length === 0 && !loading && (
                <div className="list-group-item text-muted small">No submissions for this date.</div>
              )}
              {rows.map((r) => (
                <button
                  key={r.user_id}
                  type="button"
                  className={`list-group-item list-group-item-action text-start${
                    selectedUserId === r.user_id ? " active" : ""
                  }`}
                  onClick={() => loadDetails(r.user_id)}
                >
                  <div className="fw-semibold">{r.representative_name}</div>
                  <div className="small opacity-75">
                    {r.submission_count} submission{r.submission_count !== 1 ? "s" : ""}
                    {r.entry_types?.length ? ` · ${r.entry_types.join(", ")}` : ""}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm">
            <div className="card-header py-2 small fw-semibold">Details</div>
            <div className="card-body">
              {!selectedUserId && (
                <p className="text-muted small mb-0">Select a representative to view submissions.</p>
              )}
              {detailLoading && <p className="text-muted small">Loading…</p>}
              {details && !detailLoading && (
                <>
                  <p className="small mb-2">
                    <strong>{details.representative_name}</strong>
                    {details.user_name !== details.representative_name && (
                      <span className="text-muted"> ({details.user_name})</span>
                    )}
                    {" · "}
                    {formatDateDisplay(details.date)}
                  </p>
                  {(details.data || []).map((report) => (
                    <DetailBlock key={report.id} report={report} />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
