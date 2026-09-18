import { useState, useEffect } from "react";
import { createRole, updateRole, getRole } from "./RoleService";

const RoleForm = ({ selectedId, onSuccess, onCancel }) => {
  const [form, setForm] = useState({ role_name: "", description: "", is_active: true });

  useEffect(() => {
    if (selectedId) {
      getRole(selectedId).then((res) => setForm(res.data));
    }
  }, [selectedId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedId) await updateRole(selectedId, form);
    else await createRole(form);

    onSuccess();
  };

  return (
    <div className="card p-3">
      <h5>{selectedId ? "Edit Role" : "Add New Role"}</h5>

      <form onSubmit={handleSubmit}>
        <input
          className="form-control mb-2"
          placeholder="Role Name"
          value={form.role_name}
          onChange={(e) => setForm({ ...form, role_name: e.target.value })}
          required
        />

        <textarea
          className="form-control mb-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        ></textarea>

        <div className="form-check mb-2">
          <input
            type="checkbox"
            className="form-check-input"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />{" "}
          Active
        </div>

        <button className="btn btn-primary me-2">{selectedId ? "Update" : "Create"}</button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </form>
    </div>
  );
};

export default RoleForm;
