import React, { useEffect, useState } from "react";
import userRoleService from "./userRoleService";
import { toast } from "react-toastify";
import { DeleteButton, ActionCell } from "../../../components/ui/ActionButtons";

const UserRoleMappingPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [priority, setPriority] = useState(1);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = () => {
    userRoleService.getUsers().then((res) => setUsers(res.data?.data || res.data || []));
  };

  const loadRoles = () => {
    userRoleService.getRoles().then((res) => {
      const list = res.data?.data || res.data || [];
      setRoles(Array.isArray(list) ? list : []);
    });
  };

  const loadUserRoles = () => {
    if (!selectedUser) {
      setUserRoles([]);
      setSelectedRole("");
      setPriority(1);
      return;
    }

    userRoleService.getUserRoles(selectedUser).then((res) => {
      const assignedRoles = Array.isArray(res.data) ? res.data : [];
      const primaryRole = assignedRoles[0];

      setUserRoles(assignedRoles);
      setSelectedRole(primaryRole ? String(primaryRole.role_id) : "");
      setPriority(primaryRole?.priority ?? 1);
    });
  };

  useEffect(() => {
    loadUserRoles();
  }, [selectedUser]);

  const handleAssign = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error("Select user and role");
      return;
    }

    try {
      await userRoleService.assignRole({
        user_id: Number(selectedUser),
        role_id: Number(selectedRole),
        priority: Number(priority),
      });
      toast.success("Role assigned successfully!");
      loadUserRoles();
    } catch {
      toast.error("Failed to assign role");
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Remove this role?")) return;
    try {
      await userRoleService.removeUserRole(id);
      toast.success("Role removed");
      loadUserRoles();
    } catch {
      toast.error("Error removing role");
    }
  };

  const roleOptions = Array.isArray(roles) ? roles : roles?.data || [];

  return (
    <div className="page-content">
      <div className="hf-page-card">
        <h2 className="page-title mb-1">User Role Mapping</h2>
        <p className="page-subtitle mb-4">Assign roles to users with priority.</p>

        <div className="row g-3 mb-4 p-3 rounded border bg-light">
          <div className="col-12 col-md-4">
            <label className="form-label">User</label>
            <select
              className="form-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Select user</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {[u.firstname, u.lastname].filter(Boolean).join(" ") || u.email}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label">Role</label>
            <select
              className="form-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">Select role</option>
              {roleOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.role_name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-2">
            <label className="form-label">Priority</label>
            <input
              type="number"
              min="1"
              className="form-control"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-2 d-flex align-items-end">
            <button type="button" className="btn btn-primary w-100" onClick={handleAssign}>
              Assign
            </button>
          </div>
        </div>

        {selectedUser && (
          <>
            <h5 className="h6 fw-semibold mb-3">Assigned roles</h5>
            <div className="hf-table-wrap">
              <table className="table hf-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Priority</th>
                    <th style={{ width: "120px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userRoles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="hf-table-empty">
                        No roles assigned to this user.
                      </td>
                    </tr>
                  ) : (
                    userRoles.map((item) => (
                      <tr key={item.id}>
                        <td className="fw-semibold">{item.role?.role_name || "—"}</td>
                        <td>{item.priority}</td>
                        <td>
                          <ActionCell>
                            <DeleteButton label="Remove" onClick={() => handleRemove(item.id)} />
                          </ActionCell>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserRoleMappingPage;
