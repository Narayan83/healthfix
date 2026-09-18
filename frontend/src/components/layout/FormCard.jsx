import React from "react";

export default function FormCard({ children, onSubmit, footer }) {
  const Tag = onSubmit ? "form" : "div";
  return (
    <div className="card shadow-sm border-0 hf-form-card">
      <Tag className="card-body hf-form-card-body" onSubmit={onSubmit}>
        {children}
        {footer && (
          <div className="hf-form-footer d-flex flex-wrap justify-content-end gap-2 border-top">
            {footer}
          </div>
        )}
      </Tag>
    </div>
  );
}

export function FormActions({ onClear, onSave, saveLabel = "Save", clearLabel = "Clear" }) {
  return (
    <>
      <button type="button" className="btn btn-outline-secondary px-4" onClick={onClear}>
        {clearLabel}
      </button>
      <button type="submit" className="btn btn-primary px-4">
        {saveLabel}
      </button>
    </>
  );
}

export function RadioGroup({ name, label, options, defaultValue, value, onChange }) {
  const selected = value ?? defaultValue;
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="d-flex flex-wrap gap-2 hf-radio-group">
        {options.map((opt) => (
          <div className="form-check" key={opt.value}>
            <input
              className="form-check-input"
              type="radio"
              name={name}
              id={`${name}-${opt.value}`}
              value={opt.value}
              checked={selected === opt.value}
              onChange={() => onChange?.(opt.value)}
              defaultChecked={value === undefined ? defaultValue === opt.value : undefined}
            />
            <label className="form-check-label" htmlFor={`${name}-${opt.value}`}>
              {opt.label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
