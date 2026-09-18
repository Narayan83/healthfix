export default function ReportDateBar({ date, onDateChange, onLoad, loading, label = "Date" }) {
  return (
    <div className="hf-report-filters d-flex flex-wrap align-items-end gap-2 mb-3">
      <div>
        <label className="form-label small mb-1">{label}</label>
        <input
          type="date"
          className="form-control form-control-sm"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>
      <button type="button" className="btn btn-primary btn-sm" onClick={onLoad} disabled={loading}>
        {loading ? "Loading…" : "Load"}
      </button>
    </div>
  );
}
