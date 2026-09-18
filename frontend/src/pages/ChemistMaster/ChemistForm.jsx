import { useEffect, useState } from "react";
import { createChemist, getChemist, updateChemist } from "./ChemistMasterService";
import { RadioGroup } from "../../components/layout/FormCard";
import { emptyChemistForm } from "./chemistFormDefaults";
import AreaSelectField from "../DoctorMaster/AreaSelectField";

export default function ChemistForm({ selectedId, onSuccess, onCancel }) {
  const [form, setForm] = useState(emptyChemistForm());

  useEffect(() => {
    if (selectedId) {
      getChemist(selectedId).then((res) => {
        const data = res.data;
        setForm({
          ...emptyChemistForm(),
          ...data,
          area_id: data.area_id ?? data.area?.id ?? null,
        });
      });
    } else {
      setForm(emptyChemistForm());
    }
  }, [selectedId]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedId) await updateChemist(selectedId, form);
    else await createChemist(form);
    onSuccess();
  };

  return (
    <div className="mb-4 p-3 border rounded bg-light">
      <h5 className="mb-3">{selectedId ? "Edit Chemist" : "Add Chemist"}</h5>
      <form onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-12 col-md-6">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              value={form.name}
              onChange={set("name")}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Owner Name</label>
            <input type="text" className="form-control" value={form.owner_name} onChange={set("owner_name")} />
          </div>
          <div className="col-12 col-md-6">
            <AreaSelectField
              value={form.area_id}
              onChange={(id) => setForm({ ...form, area_id: id })}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Search Place</label>
            <input
              type="text"
              className="form-control"
              placeholder="Area, city..."
              value={form.search_place}
              onChange={set("search_place")}
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
            <label className="form-label">Address Line 3</label>
            <input type="text" className="form-control" value={form.address_line3} onChange={set("address_line3")} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Address Line 4</label>
            <input type="text" className="form-control" value={form.address_line4} onChange={set("address_line4")} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Address Line 5</label>
            <input
              type="text"
              className="form-control"
              placeholder="Postal code"
              value={form.address_line5}
              onChange={set("address_line5")}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Mobile Number</label>
            <input
              type="tel"
              className="form-control"
              value={form.mobile}
              onChange={set("mobile")}
              maxLength={10}
              placeholder="10 digits"
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
          <button type="submit" className="btn btn-primary me-2">
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
