export default function TablePagination({ page, totalPages, total, onPrev, onNext, disabledPrev, disabledNext }) {
  return (
    <div className="hf-pagination">
      <span className="hf-pagination-info">
        {total != null ? `${total} record${total === 1 ? "" : "s"}` : ""}
        {totalPages > 0 && ` · Page ${page} of ${totalPages}`}
      </span>
      <div className="hf-pagination-btns">
        <button type="button" className="btn btn-outline-secondary btn-sm" disabled={disabledPrev} onClick={onPrev}>
          Previous
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm" disabled={disabledNext} onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
