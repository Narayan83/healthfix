import { useEffect, useState } from "react";
import TablePagination from "../../components/ui/TablePagination";
import { ActionCell, EditButton, DeleteButton } from "../../components/ui/ActionButtons";
import useMenuPermissions from "../../hooks/useMenuPermissions";
import PromotionStockForm from "./PromotionStockForm";
import {
  deletePromotionStockEntry,
  listPromotionStockEntries,
  listPromotionStockSummaries,
} from "./PromotionStockService";

const summaryColumns = [
  { key: "item_name", label: "Item Name" },
  { key: "balance_quantity", label: "Stock Qty" },
  { key: "balance_value", label: "Stock Value" },
];

const entryColumns = [
  { key: "item_name", label: "Item Name" },
  { key: "entry_type", label: "Type" },
  { key: "quantity", label: "Quantity" },
  { key: "value", label: "Value" },
  { key: "entry_date", label: "Date" },
];

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function formatNum(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function PromotionStock() {
  const perms = useMenuPermissions();
  const canCreate = perms == null ? true : Boolean(perms.can_create);
  const canUpdate = perms == null ? true : Boolean(perms.can_update);
  const canDelete = perms == null ? true : Boolean(perms.can_delete);

  const [summaryRows, setSummaryRows] = useState([]);
  const [entryRows, setEntryRows] = useState([]);
  const [page, setPage] = useState(1);
  const [entryPage, setEntryPage] = useState(1);
  const [limit] = useState(10);
  const [filter, setFilter] = useState("");
  const [summaryTotal, setSummaryTotal] = useState(0);
  const [entryTotal, setEntryTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    listPromotionStockSummaries(page, limit, filter).then((res) => {
      setSummaryRows(res.data.data || []);
      setSummaryTotal(res.data.total || 0);
    });
    listPromotionStockEntries(entryPage, limit, filter).then((res) => {
      setEntryRows(res.data.data || []);
      setEntryTotal(res.data.total || 0);
    });
  };

  useEffect(() => {
    load();
  }, [page, entryPage, filter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this stock entry?")) return;
    try {
      await deletePromotionStockEntry(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete stock entry");
    }
  };

  const summaryTotalPages = Math.max(1, Math.ceil(summaryTotal / limit) || 1);
  const entryTotalPages = Math.max(1, Math.ceil(entryTotal / limit) || 1);

  return (
    <div className="page-content">
      <div className="hf-page-card">
        <h2 className="page-title mb-1">Promotion Stock</h2>
        <p className="page-subtitle mb-4">
          View stock balances per item. Add or deduct stock; use deduct for distributed quantity and value from transactions.
        </p>

        <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
          <div className="flex-grow-1" style={{ maxWidth: "320px" }}>
            <label className="form-label small text-muted mb-1">Search</label>
            <input
              className="form-control"
              placeholder="Search items..."
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
                setEntryPage(1);
              }}
            />
          </div>
          {canCreate && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSelectedId(null);
                setShowForm(true);
              }}
            >
              + Add Stock
            </button>
          )}
        </div>

        {showForm && (
          <PromotionStockForm
            selectedId={selectedId}
            onSuccess={() => {
              setShowForm(false);
              load();
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        <h5 className="mb-2">All Items Stock</h5>
        <div className="hf-table-wrap mb-3">
          <table className="table hf-table">
            <thead>
              <tr>
                {summaryColumns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaryRows.length === 0 ? (
                <tr>
                  <td colSpan={summaryColumns.length} className="hf-table-empty">
                    No stock data. Create promotion items and add stock.
                  </td>
                </tr>
              ) : (
                summaryRows.map((row) => (
                  <tr key={row.promotion_item_id}>
                    <td className="fw-semibold">{row.item_name}</td>
                    <td>{formatNum(row.balance_quantity)}</td>
                    <td>{formatNum(row.balance_value)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={summaryTotalPages}
          total={summaryTotal}
          disabledPrev={page <= 1}
          disabledNext={page * limit >= summaryTotal}
          onPrev={() => setPage(page - 1)}
          onNext={() => setPage(page + 1)}
        />

        <h5 className="mb-2 mt-4">Stock Entries</h5>
        <div className="hf-table-wrap">
          <table className="table hf-table">
            <thead>
              <tr>
                {entryColumns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                {(canUpdate || canDelete) && <th style={{ width: "180px" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {entryRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={entryColumns.length + (canUpdate || canDelete ? 1 : 0)}
                    className="hf-table-empty"
                  >
                    No stock entries yet.
                  </td>
                </tr>
              ) : (
                entryRows.map((row) => (
                  <tr key={row.id}>
                    <td className="fw-semibold">{row.promotion_item?.item_name || "—"}</td>
                    <td>
                      <span
                        className={`badge ${row.entry_type === "deduct" ? "bg-warning text-dark" : "bg-success"}`}
                      >
                        {row.entry_type === "deduct" ? "Deduct" : "Add"}
                      </span>
                    </td>
                    <td>{formatNum(row.quantity)}</td>
                    <td>{formatNum(row.value)}</td>
                    <td>{formatDate(row.entry_date)}</td>
                    {(canUpdate || canDelete) && (
                      <td>
                        <ActionCell>
                          {canUpdate && (
                            <EditButton
                              onClick={() => {
                                setSelectedId(row.id);
                                setShowForm(true);
                              }}
                            />
                          )}
                          {canDelete && <DeleteButton onClick={() => handleDelete(row.id)} />}
                        </ActionCell>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={entryPage}
          totalPages={entryTotalPages}
          total={entryTotal}
          disabledPrev={entryPage <= 1}
          disabledNext={entryPage * limit >= entryTotal}
          onPrev={() => setEntryPage(entryPage - 1)}
          onNext={() => setEntryPage(entryPage + 1)}
        />
      </div>
    </div>
  );
}
