import { useEffect, useState } from "react";
import { createDoctor, getDoctor, updateDoctor } from "./DoctorMasterService";
import { RadioGroup } from "../../components/layout/FormCard";
import { emptyDoctorForm } from "./doctorFormDefaults";
import DoctorNameAutocomplete from "./DoctorNameAutocomplete";
import AreaSelectField from "./AreaSelectField";

export default function DoctorForm({ selectedId, onSuccess, onCancel, onExistingDoctorPick }) {
  const [form, setForm] = useState(emptyDoctorForm());
  const [error, setError] = useState("");
  const [areaError, setAreaError] = useState("");

  const isCreate = !selectedId;
  const hasArea = form.area_id != null && Number(form.area_id) > 0;
  const canSubmitCreate = isCreate && hasArea;

  useEffect(() => {
    setError("");
    setAreaError("");
    if (selectedId) {
      getDoctor(selectedId).then((res) => {
        const data = res.data;
        setForm({
          ...emptyDoctorForm(),
          ...data,
          area_id: data.area_id ?? data.area?.id ?? null,
        });
      });
    } else {
      setForm(emptyDoctorForm());
    }
  }, [selectedId]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setAreaError("");

    if (!hasArea) {
      setAreaError("Please select a head quarter before saving the doctor.");
      return;
    }

    const payload = {
      ...form,
      number_of_visits: Number(form.number_of_visits) || 0,
      mobile: String(form.mobile || "").replace(/\D/g, "").slice(-10),
    };
    delete payload.search_doctor;
    delete payload.area;
    try {
      if (selectedId) await updateDoctor(selectedId, payload);
      else await createDoctor(payload);
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to save doctor";
      if (msg.toLowerCase().includes("area")) setAreaError(msg);
      else setError(msg);
    }
  };

  return (
    <div className="mb-4 p-3 border rounded bg-light">
      <h5 className="mb-3">{selectedId ? "Edit Doctor" : "Add Doctor"}</h5>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <DoctorNameAutocomplete
              value={form.full_name}
              onChange={(full_name) => setForm({ ...form, full_name })}
              excludeId={selectedId}
              onPickExisting={onExistingDoctorPick}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <AreaSelectField
              value={form.area_id}
              onChange={(area_id) => {
                setForm({ ...form, area_id });
                if (area_id) setAreaError("");
              }}
              required
              error={areaError}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Address Line 1</label>
            <input type="text" className="form-control" value={form.address_line1} onChange={set("address_line1")} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Address Line 2</label>
            <input type="text" className="form-control" value={form.address_line2} onChange={set("address_line2")} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Area / Locality</label>
            <input type="text" className="form-control" value={form.city} onChange={set("city")} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">State / Province</label>
            <input type="text" className="form-control" value={form.state} onChange={set("state")} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Postal Code</label>
            <input type="text" className="form-control" value={form.postal_code} onChange={set("postal_code")} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Degree</label>
            <input type="text" className="form-control" value={form.degree} onChange={set("degree")} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Speciality / Department</label>
            <input type="text" className="form-control" value={form.department} onChange={set("department")} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Type of Activity</label>
            <input type="text" className="form-control" value={form.type_of_activity} onChange={set("type_of_activity")} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Number of Visits</label>
            <input
              type="number"
              min={0}
              className="form-control"
              value={form.number_of_visits}
              onChange={(e) => setForm({ ...form, number_of_visits: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Mobile Number</label>
            <input
              type="tel"
              className="form-control"
              value={form.mobile}
              onChange={(e) =>
                setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })
              }
              maxLength={10}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Hospital Number</label>
            <input type="tel" className="form-control" value={form.hospital_number} onChange={set("hospital_number")} />
          </div>
          <div className="col-12 col-md-6">
            <RadioGroup
              name="gender"
              label="Gender"
              value={form.gender}
              onChange={(v) => setForm({ ...form, gender: v })}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Date of Birth</label>
            <input type="date" className="form-control" value={form.date_of_birth} onChange={set("date_of_birth")} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Wedding Anniversary</label>
            <input
              type="date"
              className="form-control"
              value={form.wedding_anniversary}
              onChange={set("wedding_anniversary")}
            />
          </div>
          <div className="col-12 col-md-6">
            <RadioGroup
              name="status"
              label="Status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>
        </div>
        <div className="mt-3">
          <button
            type="submit"
            className="btn btn-primary me-2"
            disabled={isCreate && !canSubmitCreate}
            title={isCreate && !canSubmitCreate ? "Select a head quarter to create doctor" : undefined}
          >
            {selectedId ? "Update" : "Create"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
