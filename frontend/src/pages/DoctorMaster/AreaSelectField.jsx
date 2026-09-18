import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdAdd } from "react-icons/md";
import { listAreaOptions } from "../AreaMaster/AreaMasterService";
import AreaQuickForm from "./AreaQuickForm";

function AreaAddModal({ open, onClose, onCreated }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="hf-modal-root" role="presentation">
      <div className="hf-modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="modal fade show d-block hf-modal-dialog-wrap"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-hq-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="add-hq-modal-title">
                Add New Head Quarter
              </h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <AreaQuickForm open={open} onCreated={onCreated} onCancel={onClose} />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AreaSelectField({ value, onChange, refreshKey = 0, required = false, error }) {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadAreas = useCallback(() => {
    setLoading(true);
    listAreaOptions()
      .then((res) => setAreas(res.data.data || []))
      .catch(() => setAreas([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAreas();
  }, [loadAreas, refreshKey]);

  const selectValue = value != null && value !== "" ? String(value) : "";

  const handleCreated = (area) => {
    setShowAddModal(false);
    loadAreas();
    if (area?.id) onChange(area.id);
  };

  return (
    <div className="hf-area-select-field">
      <label className="form-label">
        Head Quarter {required && <span className="text-danger">*</span>}
      </label>
      <div className="hf-area-select-row">
        <select
          className={`form-select${error ? " is-invalid" : ""}`}
          value={selectValue}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v ? Number(v) : null);
          }}
          disabled={loading}
          required={required}
        >
          <option value="">Select head quarter</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-outline-primary hf-area-add-btn"
          title="Add new head quarter"
          aria-label="Add new head quarter"
          onClick={() => setShowAddModal(true)}
        >
          <MdAdd size={22} />
        </button>
      </div>
      {loading && <span className="form-text">Loading head quarters…</span>}
      {error && <div className="invalid-feedback d-block">{error}</div>}

      <AreaAddModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
