import { useEffect, useState } from "react";
import { createDesignation, getDesignation, updateDesignation } from "./DesignationMasterService";
import { RadioGroup } from "../../components/layout/FormCard";

export default function DesignationForm({ selectedId, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    status: "active",
  });

  useEffect(() => {
    if (selectedId) {
      getDesignation(selectedId).then((res) => setForm(res.data));
    } else {
      setForm({ name: "", code: "", description: "", status: "active" });
    }
  }, [selectedId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedId) await updateDesignation(selectedId, form);
    else await createDesignation(form);
    onSuccess();
  };

  return (
    <div className="mb-4 p-3 border rounded bg-light">
      <h5 className="mb-3">{selectedId ? "Edit Designation" : "Add Designation"}</h5>
      <form onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <label className="form-label">Designation Name</label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Code</label>
            <input
              className="form-control"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>
          <div className="col-12">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="col-12 col-md-6">
            <RadioGroup
              name="status"
              label="Status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>
        </div>
        <div className="mt-3">
          <button type="submit" className="btn btn-primary me-2">
            {selectedId ? "Update" : "Create"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
