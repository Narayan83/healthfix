import { useEffect, useState } from "react";
import { createArea } from "../AreaMaster/AreaMasterService";

export default function AreaQuickForm({ onCreated, onCancel, open }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
      setSaving(false);
    }
  }, [open]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Head Quarter name is required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await createArea({ name: trimmed, status: "active" });
      onCreated?.(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create head quarter");
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div>
      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      <label className="form-label" htmlFor="hq-quick-name">
        Head Quarter Name
      </label>
      <input
        id="hq-quick-name"
        className="form-control mb-3"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Enter head quarter name"
        autoFocus
      />
      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Head Quarter"}
        </button>
      </div>
    </div>
  );
}
