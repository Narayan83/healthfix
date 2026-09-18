export function EditButton({ onClick, label = "Edit" }) {
  return (
    <button type="button" className="btn hf-btn-action hf-btn-edit" onClick={onClick}>
      {label}
    </button>
  );
}

export function DeleteButton({ onClick, label = "Delete" }) {
  return (
    <button type="button" className="btn hf-btn-action hf-btn-delete" onClick={onClick}>
      {label}
    </button>
  );
}

export function ActionCell({ children }) {
  return <div className="hf-actions">{children}</div>;
}
