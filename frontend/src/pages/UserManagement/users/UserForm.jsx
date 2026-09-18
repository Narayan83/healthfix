import { useEffect, useState } from "react";
import FormCard, { RadioGroup } from "../../../components/layout/FormCard";
import { createUser, updateUser } from "./userService";
import { getRepresentativeOptions } from "../../RepresentativeMaster/RepresentativeMasterService";
import { defaultUserForm } from "./userFormDefaults";

function buildPayload(form, isEdit) {
  const repId = form.representative_id ? Number(form.representative_id) : 0;
  const payload = {
    firstname: form.firstname.trim(),
    lastname: form.lastname.trim(),
    email: form.email.trim(),
    mobile_number: form.mobile_number.trim(),
    gender: form.gender,
    active: form.active,
    is_user: true,
    representative_id: repId > 0 ? repId : 0,
  };
  if (!isEdit) {
    payload.password = form.password;
    payload.password_confirm = form.password_confirm;
  }
  return payload;
}

export default function UserForm({ user, onSuccess, onCancel }) {
  const [form, setForm] = useState(defaultUserForm);
  const [representatives, setRepresentatives] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getRepresentativeOptions()
      .then((res) => setRepresentatives(res.data?.data || []))
      .catch(() => setRepresentatives([]));
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        ...defaultUserForm,
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        email: user.email || "",
        mobile_number: user.mobile_number || "",
        gender: user.gender || "Male",
        representative_id: user.representative_id ? String(user.representative_id) : "",
        active: user.active !== false,
      });
    } else {
      setForm(defaultUserForm);
    }
    setError("");
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) {
      if (!form.password) {
        setError("Please enter a password.");
        return;
      }
      if (form.password !== form.password_confirm) {
        setError("Passwords do not match.");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = buildPayload(form, Boolean(user));
      if (user) await updateUser(user.id, payload);
      else await createUser(payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hf-master-form-panel mb-4">
      <h5 className="hf-master-form-title mb-3">{user ? "Edit User" : "Create User"}</h5>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <FormCard
        onSubmit={handleSubmit}
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary px-4" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-4" disabled={saving}>
              {saving ? "Saving…" : user ? "Update User" : "Create User"}
            </button>
          </>
        }
      >
        <p className="hf-form-section-label">Personal details</p>
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label">First Name *</label>
            <input
              className="form-control"
              value={form.firstname}
              onChange={(e) => setForm({ ...form, firstname: e.target.value })}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Last Name *</label>
            <input
              className="form-control"
              value={form.lastname}
              onChange={(e) => setForm({ ...form, lastname: e.target.value })}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-control"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Mobile *</label>
            <input
              className="form-control"
              value={form.mobile_number}
              onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
              required
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Gender</label>
            <select
              className="form-select"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="col-12 col-md-6">
            <RadioGroup
              name="user_active"
              label="Account status"
              value={form.active ? "active" : "inactive"}
              onChange={(v) => setForm({ ...form, active: v === "active" })}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>
        </div>

        <p className="hf-form-section-label">Representative mapping</p>
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-6">
            <label className="form-label">Representative</label>
            <select
              className="form-select"
              value={form.representative_id}
              onChange={(e) => setForm({ ...form, representative_id: e.target.value })}
            >
              <option value="">— None —</option>
              {representatives.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {[r.name, r.code].filter(Boolean).join(" · ")}
                  {r.territory ? ` (${r.territory})` : ""}
                </option>
              ))}
            </select>
            <div className="form-text">Link this user to a field representative.</div>
          </div>
        </div>

        {!user && (
          <>
            <p className="hf-form-section-label">Login credentials</p>
            <div className="row g-2">
              <div className="col-12 col-md-6">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="form-control"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  className="form-control"
                  value={form.password_confirm}
                  onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          </>
        )}

        {user && (
          <p className="form-text mb-0">
            Users can change their own password from{" "}
            <strong>User Management → Password Change</strong> (requires current password).
          </p>
        )}
      </FormCard>
    </div>
  );
}
