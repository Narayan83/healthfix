import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../../../../Config";
import TablePagination from "../../../../components/ui/TablePagination";
import "../../styles/auditlogs.scss";

const columns = [
  { key: "menu_label", label: "Menu / Context" },
  { key: "action", label: "Action" },
  { key: "entity", label: "Entity" },
  { key: "user_email", label: "User" },
  { key: "client_ip", label: "IP" },
  { key: "created_at", label: "Date/Time" },
  { key: "details", label: "Details" },
];

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function changeCount(row) {
  try {
    const oldObj = row.old_value && typeof row.old_value === "object" ? row.old_value : {};
    const newObj = row.new_value && typeof row.new_value === "object" ? row.new_value : {};
    const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    return keys.size || 1;
  } catch {
    return 1;
  }
}

export default function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    const filter = search.trim();
    try {
      const res = await axios.get(`${BASE_URL}/api/audit-logs`, {
        params: { page, limit, ...(filter ? { filter } : {}) },
      });
      setRows(res.data?.data || []);
      setTotal(res.data?.total ?? 0);
    } catch (err) {
      const status = err?.response?.status;
      const base = err?.response?.data?.error || err.message || "Failed to load audit logs";
      if (status === 404) {
        setError(
          `${base} (HTTP 404). Restart the backend (go run main.go) after updating code, then run: go run ./cmd/ensure_audit_logs`
        );
      } else {
        setError(status ? `${base} (HTTP ${status})` : base);
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    const t = setTimeout(() => fetchLogs(), search.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchLogs]);

  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="auditlogs-container">
      <div className="auditlogs-header">
        <h2>Audit Logs</h2>
      </div>
      <div className="auditlogs-controls">
        <input
          type="text"
          className="auditlogs-search"
          placeholder="Search (menu, user, action, entity)"
          value={search}
          onChange={handleSearchChange}
        />
        <div className="auditlogs-total">
          <label className="auditlogs-page-size">
            <span>Per page</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              disabled={loading}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
          <span className="auditlogs-total-badge">
            Total: {total} log{total !== 1 ? "s" : ""}
            {loading ? " (loading…)" : ` · Page ${page} of ${totalPages}`}
          </span>
          <button
            type="button"
            className="auditlogs-refresh"
            onClick={() => {
              setPage(1);
              fetchLogs();
            }}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>
      {error && <p style={{ color: "#b91c1c", padding: "0 16px" }}>{error}</p>}
      <div className="auditlogs-table-wrapper">
        <table className="auditlogs-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center", padding: 24 }}>
                  No audit logs found.
                </td>
              </tr>
            ) : (
              rows.map((log) => (
                <React.Fragment key={log.id}>
                  <tr>
                    <td>{log.menu_label || "—"}</td>
                    <td><span className="auditlogs-action">{log.action}</span></td>
                    <td>{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ""}</td>
                    <td><span className="auditlogs-user">{log.user_email || "—"}</span></td>
                    <td>{log.client_ip || "—"}</td>
                    <td>{formatDateTime(log.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        className="auditlogs-view"
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      >
                        {expandedId === log.id ? "Hide" : "View"} ({changeCount(log)})
                      </button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr>
                      <td colSpan={columns.length}>
                        <pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap", background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                          {JSON.stringify({ old_value: log.old_value, new_value: log.new_value }, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="auditlogs-pagination">
        <TablePagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabledPrev={loading || page <= 1}
          disabledNext={loading || page >= totalPages}
        />
      </div>
    </div>
  );
}
