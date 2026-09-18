import { useEffect, useRef, useState } from "react";
import SearchField from "../../components/ui/SearchField";
import DoctorSuggestionsPanel from "./DoctorSuggestionsPanel";
import useDoctorSuggestions from "./useDoctorSuggestions";

export default function DoctorSearchBar({ value, onChange, onSearch, onPickDoctor }) {
  const { suggestions, loading } = useDoctorSuggestions(value);
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
    onPickDoctor?.(doctor);
  };

  const handleSearch = () => {
    setOpen(false);
    onSearch?.();
  };

  return (
    <div className="hf-search-with-suggestions" ref={wrapRef}>
      <SearchField
        label="Search Doctor"
        placeholder="Name or ID"
        value={value}
        onChange={onChange}
        onSearch={handleSearch}
        id="hf-master-search"
      />
      {loading && <span className="hf-autocomplete-hint">Looking up doctors…</span>}
      {!loading && open && (
        <DoctorSuggestionsPanel
          suggestions={suggestions}
          onPick={handlePick}
          footnote="Press Enter or the search icon to filter the list below."
        />
      )}
    </div>
  );
}
