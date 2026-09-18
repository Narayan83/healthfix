export default function StatusBadge({ active, activeLabel = "Active", inactiveLabel = "Inactive" }) {
  return (
    <span className={`hf-badge ${active ? "hf-badge-success" : "hf-badge-muted"}`}>
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
