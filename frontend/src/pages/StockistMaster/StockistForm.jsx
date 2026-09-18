import { useEffect, useState } from "react";
import { createStockist, getStockist, updateStockist } from "./StockistMasterService";
import { RadioGroup } from "../../components/layout/FormCard";
import { emptyStockistForm } from "./stockistFormDefaults";
import AreaSelectField from "../DoctorMaster/AreaSelectField";

export default function StockistForm({ selectedId, onSuccess, onCancel }) {
  const [form, setForm] = useState(emptyStockistForm());
  const [error, setError] = useState("");
  const [hqError, setHqError] = useState("");

  useEffect(() => {
    setError("");
    setHqError("");
    if (selectedId) {
      getStockist(selectedId).then((res) => {
        const data = res.data;
        setForm({
          ...emptyStockistForm(),
          ...data,
          area_id: data.area_id ?? data.area?.id ?? null,
        });
      });
    } else {
      setForm(emptyStockistForm());
    }
  }, [selectedId]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setHqError("");
    if (!form.area_id) {
      setHqError("Head Quarter is required");
      return;
    }
    try {
      if (selectedId) await updateStockist(selectedId, form);
      else await createStockist(form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save stockist");
    }
  };

  return (
    <div className="mb-4 p-3 border rounded bg-light">
      <h5 className="mb-3">{selectedId ? "Edit Stockist" : "Add Stockist"}</h5>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <label className="form-label">Stockist Name</label>
            <input className="form-control" value={form.name} onChange={set("name")} required />
          </div>
          <div className="col-12 col-md-6">
            <AreaSelectField
              value={form.area_id}
              onChange={(area_id) => {
                setForm({ ...form, area_id });
                if (area_id) setHqError("");
              }}
              required
              error={hqError}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Place</label>
            <input className="form-control" value={form.place} onChange={set("place")} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={form.email}
              onChange={set("email")}
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
