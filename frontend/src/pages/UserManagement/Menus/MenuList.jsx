import { useEffect, useState } from "react";
import { getMenus, deleteMenu } from "./MenuService";
import MenuForm from "./MenuForm";
import PageToolbar from "../../../components/ui/PageToolbar";
import StatusBadge from "../../../components/ui/StatusBadge";
import TablePagination from "../../../components/ui/TablePagination";
import { ActionCell, EditButton, DeleteButton } from "../../../components/ui/ActionButtons";

const MenuList = () => {
  const [menus, setMenus] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filter, setFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadMenus = () => {
    getMenus(page, limit, filter).then((res) => {
      setMenus(res.data.data || []);
      setTotal(res.data.total || 0);
    });
  };

  useEffect(() => {
    loadMenus();
  }, [page, filter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this menu?")) return;
    await deleteMenu(id);
    loadMenus();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

  return (
    <div className="page-content">
      <div className="hf-page-card">
        <h2 className="page-title mb-1">Menu Management</h2>
        <p className="page-subtitle mb-4">Configure navigation menus and URLs.</p>

        <PageToolbar
          searchPlaceholder="Search menus..."
          searchValue={filter}
          onSearchChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
          actionLabel="+ Add Menu"
          onAction={() => {
            setSelectedId(null);
            setShowForm(true);
          }}
        />

        {showForm && (
          <div className="mb-4 p-3 border rounded bg-light">
            <MenuForm
              selectedId={selectedId}
              onSuccess={() => {
                setShowForm(false);
                loadMenus();
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <div className="hf-table-wrap">
          <table className="table hf-table">
            <thead>
              <tr>
                <th>Menu</th>
                <th>URL</th>
                <th>Parent</th>
                <th>Status</th>
                <th style={{ width: "180px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menus.length === 0 ? (
                <tr>
                  <td colSpan={5} className="hf-table-empty">
                    No menus found.
                  </td>
                </tr>
              ) : (
                menus.map((m) => (
                  <tr key={m.id}>
                    <td className="fw-semibold">{m.menu_name}</td>
                    <td>
                      <code className="text-muted small">{m.url || "—"}</code>
                    </td>
                    <td>{m.parent?.menu_name || "—"}</td>
                    <td>
                      <StatusBadge active={m.is_active !== false} />
                    </td>
                    <td>
                      <ActionCell>
                        <EditButton
                          onClick={() => {
                            setSelectedId(m.id);
                            setShowForm(true);
                          }}
                        />
                        <DeleteButton onClick={() => handleDelete(m.id)} />
                      </ActionCell>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          total={total}
          disabledPrev={page <= 1}
          disabledNext={page * limit >= total}
          onPrev={() => setPage(page - 1)}
          onNext={() => setPage(page + 1)}
        />
      </div>
    </div>
  );
};

export default MenuList;
