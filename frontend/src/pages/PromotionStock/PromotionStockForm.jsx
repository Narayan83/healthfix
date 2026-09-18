import { useEffect, useState } from "react";
import { listPromotionItemOptions } from "../PromotionItemMaster/PromotionItemMasterService";
import {
  createPromotionStockEntry,
  getPromotionStockEntry,
  updatePromotionStockEntry,
} from "./PromotionStockService";

function toDateInputValue(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function PromotionStockForm({ selectedId, onSuccess, onCancel }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    promotion_item_id: "",
    entry_type: "add",
    quantity: "",
    value: "",
    entry_date: new Date().toISOString().slice(0, 10),
    remarks: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    listPromotionItemOptions().then((res) => setItems(res.data.data || []));
  }, []);

  useEffect(() => {
    setError("");
    if (selectedId) {
      getPromotionStockEntry(selectedId).then((res) => {
        const data = res.data;
        setForm({
          promotion_item_id: String(data.promotion_item_id || ""),
          entry_type: data.entry_type || "add",
          quantity: String(data.quantity ?? ""),
          value: String(data.value ?? ""),
          entry_date: toDateInputValue(data.entry_date),
          remarks: data.remarks || "",
        });
      });
    } else {
      setForm({
        promotion_item_id: "",
        entry_type: "add",
        quantity: "",
        value: "",
        entry_date: new Date().toISOString().slice(0, 10),
        remarks: "",
      });
    }
  }, [selectedId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      promotion_item_id: Number(form.promotion_item_id),
      entry_type: form.entry_type,
      quantity: Number(form.quantity),
      value: Number(form.value),
      entry_date: `${form.entry_date}T00:00:00.000Z`,
      remarks: form.remarks,
    };
    try {
      if (selectedId) await updatePromotionStockEntry(selectedId, payload);
      else await createPromotionStockEntry(payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save stock entry");
    }
  };

  return (
    <div className="mb-4 p-3 border rounded bg-light">
      <h5 className="mb-3">{selectedId ? "Edit Stock Entry" : "Add Stock"}</h5>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <label className="form-label">Item Name</label>
            <select
              className="form-select"
              value={form.promotion_item_id}
              onChange={(e) => setForm({ ...form, promotion_item_id: e.target.value })}
              required
            >
              <option value="">Select promotion item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Entry Type</label>
            <select
              className="form-select"
              value={form.entry_type}
              onChange={(e) => setForm({ ...form, entry_type: e.target.value })}
              required
            >
              <option value="add">Add Stock</option>
              <option value="deduct">Deduct Stock</option>
            </select>
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              min="0.01"
              step="any"
              className="form-control"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label">Value</label>
            <input
              type="number"
              min="0"
              step="any"
              className="form-control"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              required
            />
          </div>
          <div className="col-12 col-md-4">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              value={form.entry_date}
              onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
              required
            />
          </div>
          <div className="col-12">
            <label className="form-label">Remarks (optional)</label>
            <input
              className="form-control"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
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
