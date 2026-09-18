import { useEffect, useState } from "react";
import { getRoles, deleteRole } from "./RoleService";
import RoleForm from "./RoleForm";
import PageToolbar from "../../../components/ui/PageToolbar";
import StatusBadge from "../../../components/ui/StatusBadge";
import TablePagination from "../../../components/ui/TablePagination";
import { ActionCell, EditButton, DeleteButton } from "../../../components/ui/ActionButtons";

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filter, setFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadRoles = () => {
    getRoles(page, limit, filter).then((res) => {
      setRoles(res.data.data || []);
      setTotal(res.data.total || 0);
    });
  };

  useEffect(() => {
    loadRoles();
  }, [page, filter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this role?")) return;
    await deleteRole(id);
    loadRoles();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

  return (
    <div className="page-content">
      <div className="hf-page-card">
        <h2 className="page-title mb-1">Role Management</h2>
        <p className="page-subtitle mb-4">Create and manage roles for access control.</p>

        <PageToolbar
          searchPlaceholder="Search roles..."
          searchValue={filter}
          onSearchChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
          actionLabel="+ Add Role"
          onAction={() => {
            setSelectedId(null);
            setShowForm(true);
          }}
        />

        {showForm && (
          <div className="mb-4 p-3 border rounded bg-light">
            <RoleForm
              selectedId={selectedId}
              onSuccess={() => {
                setShowForm(false);
                loadRoles();
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <div className="hf-table-wrap">
          <table className="table hf-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Description</th>
                <th>Status</th>
                <th style={{ width: "180px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="hf-table-empty">
                    No roles found. Add a role to get started.
                  </td>
                </tr>
              ) : (
                roles.map((r) => (
                  <tr key={r.id}>
                    <td className="fw-semibold">{r.role_name}</td>
                    <td className="text-muted">{r.description || "—"}</td>
                    <td>
                      <StatusBadge active={r.is_active !== false} />
                    </td>
                    <td>
                      <ActionCell>
                        <EditButton
                          onClick={() => {
                            setSelectedId(r.id);
                            setShowForm(true);
                          }}
                        />
                        <DeleteButton onClick={() => handleDelete(r.id)} />
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

export default RoleList;
