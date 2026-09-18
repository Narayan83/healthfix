import { useEffect, useState } from "react";
import {
  createPromotionItem,
  getPromotionItem,
  updatePromotionItem,
} from "./PromotionItemMasterService";
import { RadioGroup } from "../../components/layout/FormCard";

export default function PromotionItemForm({ selectedId, onSuccess, onCancel }) {
  const [form, setForm] = useState({ item_name: "", status: "active" });
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    if (selectedId) {
      getPromotionItem(selectedId).then((res) => setForm(res.data));
    } else {
      setForm({ item_name: "", status: "active" });
    }
  }, [selectedId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (selectedId) await updatePromotionItem(selectedId, form);
      else await createPromotionItem(form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save promotion item");
    }
  };

  return (
    <div className="mb-4 p-3 border rounded bg-light">
      <h5 className="mb-3">{selectedId ? "Edit Promotion Item" : "Add Promotion Item"}</h5>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <label className="form-label">Item Name</label>
            <input
              className="form-control"
              value={form.item_name}
              onChange={(e) => setForm({ ...form, item_name: e.target.value })}
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
