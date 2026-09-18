import { useEffect, useState } from "react";
import { createProduct, getProduct, updateProduct } from "./ProductMasterService";
import { RadioGroup } from "../../components/layout/FormCard";
import { emptyProductForm } from "./productFormDefaults";

export default function ProductForm({ selectedId, onSuccess, onCancel }) {
  const [form, setForm] = useState(emptyProductForm());
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    if (selectedId) {
      getProduct(selectedId).then((res) => setForm({ ...emptyProductForm(), ...res.data }));
    } else {
      setForm(emptyProductForm());
    }
  }, [selectedId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      product_code: form.product_code.trim(),
    };
    try {
      if (selectedId) await updateProduct(selectedId, payload);
      else await createProduct(payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save product");
    }
  };

  return (
    <div className="mb-4 p-3 border rounded bg-light">
      <h5 className="mb-3">{selectedId ? "Edit Product" : "Add Product"}</h5>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <label className="form-label">Product Code</label>
            <input
              className="form-control"
              value={form.product_code}
              onChange={(e) => setForm({ ...form, product_code: e.target.value })}
              placeholder="Unique code e.g. PRD-001"
              required
            />
            <div className="form-text">Must be unique across all products.</div>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Product Name</label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
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
            <label className="form-label">Packing</label>
            <input
              className="form-control"
              value={form.packing || ""}
              onChange={(e) => setForm({ ...form, packing: e.target.value })}
              placeholder="e.g. 10'S, 100ML"
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
          <div className="col-12 col-md-6">
            <RadioGroup
              name="category"
              label="Product Category"
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
              options={[
                { value: "medical", label: "Medical" },
                { value: "surgical", label: "Surgical" },
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
