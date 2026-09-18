import SearchField from "./SearchField";

export default function PageToolbar({
  searchLabel,
  searchPlaceholder,
  onSearchChange,
  onSearch,
  searchValue,
  actionLabel,
  onAction,
}) {
  return (
    <div className="hf-toolbar">
      {(searchPlaceholder || searchLabel) && (
        <SearchField
          label={searchLabel}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={onSearchChange}
          onSearch={onSearch ?? (() => onSearchChange?.(searchValue))}
        />
      )}
      {actionLabel && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}