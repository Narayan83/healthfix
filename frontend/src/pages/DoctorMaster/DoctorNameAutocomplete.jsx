import { useEffect, useRef, useState } from "react";
import DoctorSuggestionsPanel from "./DoctorSuggestionsPanel";
import useDoctorSuggestions from "./useDoctorSuggestions";

export default function DoctorNameAutocomplete({
  value,
  onChange,
  excludeId = null,
  onPickExisting,
  required,
}) {
  const { suggestions, loading } = useDoctorSuggestions(value, excludeId);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setOpen(suggestions.length > 0);
  }, [suggestions]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handlePick = (doctor) => {
    setOpen(false);
    onPickExisting?.(doctor);
  };

  return (
    <div className="hf-autocomplete" ref={wrapRef}>
      <label className="form-label">Full Name</label>
      <input
        type="text"
        className="form-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
        required={required}
      />
      {loading && <span className="hf-autocomplete-hint">Checking existing doctors…</span>}
      {!loading && open && (
        <DoctorSuggestionsPanel
          suggestions={suggestions}
          onPick={handlePick}
          footnote="Select a match to open that record, or use a different name if this is a new doctor."
        />
      )}
    </div>
  );
}
