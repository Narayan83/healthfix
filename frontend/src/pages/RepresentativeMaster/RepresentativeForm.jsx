import { useEffect, useState } from "react";
import FormCard, { RadioGroup } from "../../components/layout/FormCard";
import {
  createRepresentative,
  getRepresentative,
  updateRepresentative,
} from "./RepresentativeMasterService";
import { defaultRepresentativeForm } from "./representativeFormDefaults";

export default function RepresentativeForm({ selectedId, onSuccess, onCancel }) {
  const [form, setForm] = useState(defaultRepresentativeForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedId) {
      getRepresentative(selectedId).then((res) => setForm({ ...defaultRepresentativeForm, ...res.data }));
    } else {
      setForm(defaultRepresentativeForm);
    }
    setError("");
  }, [selectedId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (selectedId) await updateRepresentative(selectedId, form);
      else await createRepresentative(form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save representative");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hf-master-form-panel mb-4">
      <h5 className="hf-master-form-title mb-3">
        {selectedId ? "Edit Representative" : "Add Representative"}
      </h5>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <FormCard
        onSubmit={handleSubmit}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-4" disabled={saving}>
              {saving ? "Saving…" : selectedId ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <label className="form-label">Representative Name *</label>
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
          <div className="col-12 col-md-6">
            <label className="form-label">Mobile</label>
            <input
              className="form-control"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="col-12">
            <label className="form-label">Territory / Area</label>
            <input
              className="form-control"
              value={form.territory}
              onChange={(e) => setForm({ ...form, territory: e.target.value })}
              placeholder="e.g. North Zone, Mumbai"
            />
          </div>
          <div className="col-12 col-md-6">
            <RadioGroup
              name="rep_status"
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
      </FormCard>
    </div>
  );
}
