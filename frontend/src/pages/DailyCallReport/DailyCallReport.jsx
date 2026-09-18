import { useCallback, useEffect, useState } from "react";
import PageLayout from "../../components/layout/PageLayout";
import { listAreaOptions } from "../AreaMaster/AreaMasterService";
import { listPromotionItemOptions } from "../PromotionItemMaster/PromotionItemMasterService";
import ProductPickerModal from "./ProductPickerModal";
import {
  checkYesterdayRequirement,
  listChemistsByArea,
  listDoctorsByArea,
  submitDailyCallReport,
} from "./DailyCallReportService";

const today = () => new Date().toISOString().slice(0, 10);

const emptyPromotionDraft = () => ({
  promotion_item_id: "",
  quantity: "",
  value: "",
});

export default function DailyCallReport() {
  const [entryType, setEntryType] = useState("report");
  const [entryDate, setEntryDate] = useState(today());
  const [areas, setAreas] = useState([]);
  const [areaId, setAreaId] = useState("");
  const [visitType, setVisitType] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [chemists, setChemists] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [chemistId, setChemistId] = useState("");
  const [remarks, setRemarks] = useState("");

  const [promoItems, setPromoItems] = useState([]);
  const [promoDraft, setPromoDraft] = useState(emptyPromotionDraft());
  const [promotionLines, setPromotionLines] = useState([]);

  const [orderLines, setOrderLines] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);

  const [yesterdayOk, setYesterdayOk] = useState(true);
  const [yesterdayMsg, setYesterdayMsg] = useState("");
  const [checkingYesterday, setCheckingYesterday] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isReport = entryType === "report";
  const visitSelected = Boolean(doctorId || chemistId);
  const reportBlocked = isReport && !yesterdayOk;

  useEffect(() => {
    listAreaOptions().then((res) => setAreas(res.data.data || []));
    listPromotionItemOptions().then((res) => setPromoItems(res.data.data || []));
  }, []);

  const runYesterdayCheck = useCallback(async () => {
    if (!isReport) {
      setYesterdayOk(true);
      setYesterdayMsg("");
      return;
    }
    setCheckingYesterday(true);
    try {
      const res = await checkYesterdayRequirement(entryDate);
      setYesterdayOk(Boolean(res.data.allowed));
      setYesterdayMsg(res.data.message || "");
    } catch {
      setYesterdayOk(false);
      setYesterdayMsg("Could not verify yesterday requirement.");
    } finally {
      setCheckingYesterday(false);
    }
  }, [entryDate, isReport]);

  useEffect(() => {
    runYesterdayCheck();
  }, [runYesterdayCheck]);

  useEffect(() => {
    setDoctorId("");
    setChemistId("");
    setDoctors([]);
    setChemists([]);
    if (!areaId) return;
    listDoctorsByArea(areaId).then((res) => setDoctors(res.data.data || []));
    listChemistsByArea(areaId).then((res) => setChemists(res.data.data || []));
  }, [areaId]);

  const resetReportFields = () => {
    setAreaId("");
    setVisitType("");
    setDoctorId("");
    setChemistId("");
    setPromotionLines([]);
    setOrderLines([]);
    setPromoDraft(emptyPromotionDraft());
  };

  const addPromotionLine = () => {
    if (!promoDraft.promotion_item_id) return;
    const item = promoItems.find((p) => String(p.id) === String(promoDraft.promotion_item_id));
    if (!item) return;
    if (promotionLines.some((l) => String(l.promotion_item_id) === String(item.id))) return;
    setPromotionLines([
      ...promotionLines,
      {
        promotion_item_id: item.id,
        item_name: item.item_name,
        quantity: promoDraft.quantity === "" ? 0 : Number(promoDraft.quantity),
        value: promoDraft.value === "" ? 0 : Number(promoDraft.value),
      },
    ]);
    setPromoDraft(emptyPromotionDraft());
  };

  const removePromotionLine = (id) => {
    setPromotionLines(promotionLines.filter((l) => l.promotion_item_id !== id));
  };

  const handleProductSelect = (product) => {
    if (orderLines.some((l) => l.product_id === product.id)) {
      setShowProductModal(false);
      return;
    }
    setOrderLines([
      ...orderLines,
      {
        product_id: product.id,
        product_code: product.product_code,
        name: product.name,
        quantity: 1,
      },
    ]);
    setShowProductModal(false);
  };

  const updateOrderQty = (productId, qty) => {
    setOrderLines(
      orderLines.map((l) =>
        l.product_id === productId ? { ...l, quantity: qty === "" ? 1 : Number(qty) } : l
      )
    );
  };

  const removeOrderLine = (productId) => {
    setOrderLines(orderLines.filter((l) => l.product_id !== productId));
  };

  const buildPayload = () => {
    const payload = {
      entry_type: entryType,
      entry_date: entryDate,
      remarks,
    };
    if (isReport) {
      payload.area_id = Number(areaId);
      payload.visit_type = visitType;
      payload.doctor_id = visitType === "doctor" && doctorId ? Number(doctorId) : null;
      payload.chemist_id = visitType === "chemist" && chemistId ? Number(chemistId) : null;
      payload.promotion_lines = promotionLines.map((l) => ({
        promotion_item_id: l.promotion_item_id,
        quantity: l.quantity ?? 0,
        value: l.value ?? 0,
      }));
      payload.order_lines = orderLines.map((l) => ({
        product_id: l.product_id,
        quantity: l.quantity > 0 ? l.quantity : 1,
      }));
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError("");
    setSuccess("");

    if (isReport && !yesterdayOk) {
      setError(yesterdayMsg || "Yesterday requirement not met.");
      return;
    }

    setSubmitting(true);
    try {
      await submitDailyCallReport(buildPayload());
      setSuccess("Submitted successfully.");
      setEntryType("report");
      setEntryDate(today());
      setRemarks("");
      resetReportFields();
      runYesterdayCheck();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const renderOrderLines = () => {
    if (orderLines.length === 0) return null;
    return (
      <div className="col-12 hf-dcr-section">
        <h6 className="hf-dcr-section__title">Order products</h6>
        <div className="d-none d-lg-block table-responsive">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Code</th>
                <th>Product</th>
                <th style={{ width: 120 }}>Order qty</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orderLines.map((l) => (
                <tr key={l.product_id}>
                  <td>{l.product_code}</td>
                  <td>{l.name}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="form-control form-control-sm"
                      value={l.quantity}
                      onChange={(e) => updateOrderQty(l.product_id, e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeOrderLine(l.product_id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="d-lg-none">
          {orderLines.map((l) => (
            <div key={l.product_id} className="hf-dcr-order-card">
              <div className="hf-dcr-order-card__title">
                {l.product_code} — {l.name}
              </div>
              <div className="d-flex align-items-center gap-2">
                <label className="form-label small mb-0">Qty</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="form-control"
                  style={{ maxWidth: 100 }}
                  value={l.quantity}
                  onChange={(e) => updateOrderQty(l.product_id, e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm ms-auto"
                  onClick={() => removeOrderLine(l.product_id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <PageLayout
      className="hf-dcr-page"
      title="Daily Call Report"
      subtitle="Record field visits, leave, or holiday."
    >
      {error && <div className="alert alert-danger py-2 mb-2 hf-dcr-alert">{error}</div>}
      {success && <div className="alert alert-success py-2 mb-2 hf-dcr-alert">{success}</div>}

      <form onSubmit={handleSubmit} id="dcr-form">
        <div className="row g-2">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm hf-dcr-card">
              <div className="card-body hf-dcr-card-body">
                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <label className="form-label">Type</label>
                    <select
                      className="form-select"
                      value={entryType}
                      onChange={(e) => {
                        setEntryType(e.target.value);
                        if (e.target.value !== "report") resetReportFields();
                      }}
                    >
                      <option value="report">Report</option>
                      <option value="leave">Leave</option>
                      <option value="holiday">Holiday</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                    />
                  </div>

                  {isReport && (
                    <>
                      <div className="col-12">
                        <label className="form-label">Area</label>
                        <select
                          className="form-select"
                          value={areaId}
                          onChange={(e) => {
                            setAreaId(e.target.value);
                            setVisitType("");
                            setDoctorId("");
                            setChemistId("");
                          }}
                        >
                          <option value="">Select area</option>
                          {areas.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {areaId && (
                        <div className="col-12">
                          <label className="form-label">Visit type</label>
                          <select
                            className="form-select"
                            value={visitType}
                            onChange={(e) => {
                              setVisitType(e.target.value);
                              setDoctorId("");
                              setChemistId("");
                            }}
                          >
                            <option value="">Doctor or chemist</option>
                            <option value="doctor">Doctor</option>
                            <option value="chemist">Chemist</option>
                          </select>
                        </div>
                      )}

                      {visitType === "doctor" && areaId && (
                        <div className="col-12">
                          <label className="form-label">Doctor</label>
                          <select
                            className="form-select"
                            value={doctorId}
                            onChange={(e) => setDoctorId(e.target.value)}
                          >
                            <option value="">Select doctor</option>
                            {doctors.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.full_name}
                                {d.search_doctor ? ` (${d.search_doctor})` : ""}
                              </option>
                            ))}
                          </select>
                          {doctors.length === 0 && (
                            <p className="form-text text-warning mb-0">
                              No doctors mapped to this area. Add or update them in Doctor Master.
                            </p>
                          )}
                        </div>
                      )}

                      {visitType === "chemist" && areaId && (
                        <div className="col-12">
                          <label className="form-label">Chemist</label>
                          <select
                            className="form-select"
                            value={chemistId}
                            onChange={(e) => setChemistId(e.target.value)}
                          >
                            <option value="">Select chemist</option>
                            {chemists.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          {chemists.length === 0 && (
                            <p className="form-text text-warning mb-0">
                              No chemists mapped to this area. Set Area on Chemist Master.
                            </p>
                          )}
                        </div>
                      )}

                      {areaId && visitType && (
                        <div className="col-12 hf-dcr-section">
                          <h6 className="hf-dcr-section__title">Promotion item</h6>
                          {!visitSelected && (
                            <p className="form-text mb-1">Select doctor or chemist above first.</p>
                          )}
                          <div className="row g-1 g-sm-2 align-items-end">
                            <div className="col-12 col-md-5">
                              <label className="form-label small">Item</label>
                              <select
                                className="form-select"
                                value={promoDraft.promotion_item_id}
                                onChange={(e) =>
                                  setPromoDraft({ ...promoDraft, promotion_item_id: e.target.value })
                                }
                                disabled={!visitSelected}
                              >
                                <option value="">Select item</option>
                                {promoItems.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.item_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-6 col-md-3">
                              <label className="form-label small">Qty</label>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                className="form-control"
                                placeholder="0"
                                value={promoDraft.quantity}
                                onChange={(e) =>
                                  setPromoDraft({ ...promoDraft, quantity: e.target.value })
                                }
                                disabled={!visitSelected}
                              />
                            </div>
                            <div className="col-6 col-md-3">
                              <label className="form-label small">Value</label>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                className="form-control"
                                placeholder="0"
                                value={promoDraft.value}
                                onChange={(e) =>
                                  setPromoDraft({ ...promoDraft, value: e.target.value })
                                }
                                disabled={!visitSelected}
                              />
                            </div>
                            <div className="col-12 col-md-1">
                              <button
                                type="button"
                                className="btn btn-outline-primary w-100 hf-dcr-promo-add"
                                onClick={addPromotionLine}
                                disabled={!visitSelected || !promoDraft.promotion_item_id}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                          {promotionLines.length > 0 && (
                            <ul className="list-group list-group-flush mt-1 hf-dcr-line-list">
                              {promotionLines.map((l) => (
                                <li
                                  key={l.promotion_item_id}
                                  className="list-group-item d-flex justify-content-between align-items-center px-0 gap-2"
                                >
                                  <span className="small">
                                    {l.item_name} — Qty: {l.quantity}, Val: {l.value}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger flex-shrink-0"
                                    onClick={() => removePromotionLine(l.promotion_item_id)}
                                  >
                                    Remove
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {visitSelected && (
                        <div className="col-12 hf-dcr-mobile-only">
                          <button
                            type="button"
                            className="btn btn-outline-primary w-100"
                            onClick={() => setShowProductModal(true)}
                            disabled={!visitSelected}
                          >
                            Add product to order
                          </button>
                        </div>
                      )}

                      {renderOrderLines()}
                    </>
                  )}

                  <div className="col-12">
                    <label className="form-label">Remarks</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Optional remarks"
                    />
                  </div>
                </div>

                <div className="hf-dcr-submit-desktop">
                  {isReport && !checkingYesterday && !yesterdayOk && (
                    <div className="alert alert-warning py-2 mb-2 hf-dcr-alert hf-dcr-yesterday-banner">
                      {yesterdayMsg || "Report submit blocked until yesterday is filed."} Use Leave or
                      Holiday for yesterday&apos;s date first.
                    </div>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting || (isReport && reportBlocked)}
                  >
                    {submitting ? "Submitting…" : "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isReport && (
            <div className="col-lg-4 hf-dcr-desktop-only">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex flex-column">
                  <h6 className="text-muted mb-3">Order products</h6>
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={() => setShowProductModal(true)}
                    disabled={!visitSelected}
                  >
                    Add product
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={`hf-dcr-page__form-spacer d-lg-none${
            isReport && !checkingYesterday && !yesterdayOk ? " hf-dcr-page__form-spacer--warn" : ""
          }`}
          aria-hidden="true"
        />

        <div className="hf-dcr-bottom-panel d-lg-none">
          {isReport && !checkingYesterday && !yesterdayOk && (
            <div className="hf-dcr-yesterday-banner" role="alert">
              {yesterdayMsg ||
                "Report submit blocked until yesterday is filed."}{" "}
              Set Type to Leave/Holiday and date to yesterday, then Submit.
            </div>
          )}
          <div className="hf-dcr-sticky-bar">
            {isReport && visitSelected && (
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setShowProductModal(true)}
                disabled={!visitSelected}
              >
                Add product
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || (isReport && reportBlocked)}
              form="dcr-form"
            >
              {submitting ? "…" : "Submit"}
            </button>
          </div>
        </div>
      </form>

      <ProductPickerModal
        show={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSelect={handleProductSelect}
      />
    </PageLayout>
  );
}
