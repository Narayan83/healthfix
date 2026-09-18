import { MdSearch } from "react-icons/md";

export default function SearchField({
  label,
  placeholder,
  value,
  onChange,
  onSearch,
  id = "hf-search",
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSearch?.();
    }
  };

  return (
    <div className="hf-search-field">
      {label && (
        <label className="hf-search-field-label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="hf-search-field-group input-group">
        <input
          id={id}
          type="search"
          className="form-control"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="btn btn-primary hf-search-btn"
          onClick={() => onSearch?.()}
          title="Search"
          aria-label="Search"
        >
          <MdSearch size={20} />
        </button>
      </div>
    </div>
  );
}
