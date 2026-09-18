export default function DoctorSuggestionsPanel({ suggestions, onPick, footnote }) {
  if (!suggestions?.length) return null;

  return (
    <div className="hf-autocomplete-panel hf-search-suggestions-panel" role="listbox">
      <p className="hf-autocomplete-title">Matching doctors — select to view record</p>
      <ul className="hf-autocomplete-list">
        {suggestions.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              className="hf-autocomplete-item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick?.(d)}
            >
              <span className="hf-autocomplete-name">{d.full_name}</span>
              <span className="hf-autocomplete-meta">
                {[d.mobile, d.city, d.department].filter(Boolean).join(" · ") || "—"}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {footnote && <p className="hf-autocomplete-foot">{footnote}</p>}
    </div>
  );
}
