import { useEffect, useState } from "react";
import { createMenu, updateMenu, getMenu, getMenuTree } from "./MenuService";

const MenuForm = ({ selectedId, onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    menu_name: "",
    description: "",
    url: "",
    icon: "",
    parent_id: "",
    sort_order: 0,
    menu_type: "main",
    is_active: true,
    requires_auth: false,
  });

  const [parentMenus, setParentMenus] = useState([]);

  const loadMenuTree = () => {
    getMenuTree().then((res) => setParentMenus(res.data));
  };

  useEffect(() => {
    loadMenuTree();
    if (selectedId) {
      getMenu(selectedId).then((res) => setForm({
        ...res.data,
        parent_id: res.data.parent_id ?? ""
      }));
    }
  }, [selectedId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      parent_id: form.parent_id === "" ? null : Number(form.parent_id)
    };

    if (selectedId) await updateMenu(selectedId, data);
    else await createMenu(data);

    onSuccess();
  };

  return (
    <div className="card p-3">
      <h5>{selectedId ? "Edit Menu" : "Add Menu"}</h5>

      <form onSubmit={handleSubmit}>
        <input
          className="form-control mb-2"
          placeholder="Menu Name"
          value={form.menu_name}
          onChange={(e) => setForm({ ...form, menu_name: e.target.value })}
          required
        />

        <input
          className="form-control mb-2"
          placeholder="URL"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
        />

        <input
          className="form-control mb-2"
          placeholder="Icon class"
          value={form.icon}
          onChange={(e) => setForm({ ...form, icon: e.target.value })}
        />

        <textarea
          className="form-control mb-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <select
          className="form-select mb-2"
          value={form.parent_id}
          onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
        >
          <option value="">No Parent (Root Menu)</option>
          {parentMenus.map((m) => (
            <option key={m.id} value={m.id}>{m.menu_name}</option>
          ))}
        </select>

        <input
          className="form-control mb-2"
          type="number"
          placeholder="Sort Order"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
        />

        <div className="form-check">
          <input type="checkbox"
            className="form-check-input"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          /> Active
        </div>

        <div className="form-check mb-2">
          <input type="checkbox"
            className="form-check-input"
            checked={form.requires_auth}
            onChange={(e) => setForm({ ...form, requires_auth: e.target.checked })}
          /> Requires Auth
        </div>

        <button className="btn btn-primary me-2">{selectedId ? "Update" : "Create"}</button>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </form>
    </div>
  );
};

export default MenuForm;
