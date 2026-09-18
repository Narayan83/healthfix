import { useEffect, useState } from "react";
import { createArea, getArea, updateArea } from "./AreaMasterService";
import { RadioGroup } from "../../components/layout/FormCard";

export default function AreaForm({ selectedId, onSuccess, onCancel }) {
  const [form, setForm] = useState({ name: "", status: "active" });
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    if (selectedId) {
      getArea(selectedId).then((res) => setForm(res.data));
    } else {
      setForm({ name: "", status: "active" });
    }
  }, [selectedId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (selectedId) await updateArea(selectedId, form);
      else await createArea(form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save head quarter");
    }
  };

  return (
    <div className="mb-4 p-3 border rounded bg-light">
      <h5 className="mb-3">{selectedId ? "Edit Head Quarter" : "Add Head Quarter"}</h5>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <label className="form-label">Head Quarter Name</label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
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
