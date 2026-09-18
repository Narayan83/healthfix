import { useEffect, useState } from "react";
import TablePagination from "../../components/ui/TablePagination";
import { listProducts } from "../ProductMaster/ProductMasterService";

export default function ProductPickerModal({ show, onClose, onSelect }) {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      listProducts(page, limit, filter).then((res) => {
        setRows(res.data.data || []);
        setTotal(res.data.total || 0);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [show, page, limit, filter]);

  useEffect(() => {
    if (!show) {
      setPage(1);
      setFilter("");
      setSearch("");
    }
  }, [show]);

  if (!show) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

  return (
    <div
      className="modal show d-block hf-modal-mobile-root"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Select product</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
          </div>
          <div className="modal-body">
            <div className="mb-3 d-flex flex-column flex-sm-row gap-2">
              <input
                type="search"
                className="form-control"
                placeholder="Search code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setPage(1);
                    setFilter(search);
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-primary flex-shrink-0"
                style={{ minHeight: 44 }}
                onClick={() => {
                  setPage(1);
                  setFilter(search);
                }}
              >
                Search
              </button>
            </div>

            <div className="d-none d-md-block table-responsive">
              <table className="table table-sm table-hover">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-muted text-center py-3">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    rows.map((p) => (
                      <tr key={p.id}>
                        <td>{p.product_code}</td>
                        <td>{p.name}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => onSelect(p)}
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-md-none">
              {rows.length === 0 ? (
                <p className="text-muted text-center py-4">No products found</p>
              ) : (
                rows.map((p) => (
                  <div key={p.id} className="hf-modal-product-row">
                    <div>
                      <div className="fw-semibold">{p.name}</div>
                      <div className="small text-muted">{p.product_code}</div>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={() => onSelect(p)}>
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>

            <TablePagination
              page={page}
              totalPages={totalPages}
              total={total}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabledPrev={page <= 1}
              disabledNext={page >= totalPages}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary w-100 w-md-auto" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
