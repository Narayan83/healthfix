import PageToolbar from "../ui/PageToolbar";
import SearchField from "../ui/SearchField";
import TablePagination from "../ui/TablePagination";
import { ActionCell, EditButton, DeleteButton } from "../ui/ActionButtons";
import useMenuPermissions from "../../hooks/useMenuPermissions";

export default function MasterListShell({
  title,
  subtitle,
  searchInHeader = false,
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearch,
  headerSearch,
  addLabel,
  onAdd,
  showForm,
  form,
  tableLoading = false,
  columns,
  rows,
  emptyMessage,
  page,
  totalPages,
  total,
  limit,
  onPrev,
  onNext,
  onEdit,
  onDelete,
  renderCells,
}) {
  const perms = useMenuPermissions();
  // New or static-sidebar routes may have no role permission row yet — allow actions unless explicitly denied
  const canCreate = perms == null ? true : Boolean(perms.can_create);
  const canUpdate = perms == null ? true : Boolean(perms.can_update);
  const canDelete = perms == null ? true : Boolean(perms.can_delete);
  const hasSearch = Boolean(searchPlaceholder || searchLabel);
  const showHeaderSearch = searchInHeader && hasSearch;

  return (
    <div className="page-content">
      <div className="hf-page-card">
        {showHeaderSearch ? (
          <div className="hf-page-header-row">
            <div className="hf-page-header-title">
              <h2 className="page-title mb-1">{title}</h2>
              {subtitle && <p className="page-subtitle mb-0">{subtitle}</p>}
            </div>
            {headerSearch || (
              <SearchField
                label={searchLabel}
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={onSearchChange}
                onSearch={onSearch}
                id="hf-master-search"
              />
            )}
            {canCreate && addLabel && (
              <button type="button" className="btn btn-primary hf-page-header-add" onClick={onAdd}>
                {addLabel}
              </button>
            )}
          </div>
        ) : (
          <>
            <h2 className="page-title mb-1">{title}</h2>
            {subtitle && <p className="page-subtitle mb-4">{subtitle}</p>}
          </>
        )}

        {!showHeaderSearch && (
          <PageToolbar
            searchLabel={searchLabel}
            searchPlaceholder={searchPlaceholder}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onSearch={onSearch}
            actionLabel={canCreate ? addLabel : null}
            onAction={onAdd}
          />
        )}

        {showForm && form}

        <div className={`hf-table-wrap${tableLoading ? " is-loading" : ""}`}>
          <table className="table hf-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                    {col.label}
                  </th>
                ))}
                {(canUpdate || canDelete) && (
                  <th style={{ width: "180px" }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (canUpdate || canDelete ? 1 : 0)}
                    className="hf-table-empty"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    {renderCells(row)}
                    {(canUpdate || canDelete) && (
                      <td>
                        <ActionCell>
                          {canUpdate && <EditButton onClick={() => onEdit(row)} />}
                          {canDelete && <DeleteButton onClick={() => onDelete(row.id)} />}
                        </ActionCell>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          total={total}
          disabledPrev={page <= 1}
          disabledNext={page * limit >= total}
          onPrev={onPrev}
          onNext={onNext}
        />
      </div>
    </div>
  );
}
