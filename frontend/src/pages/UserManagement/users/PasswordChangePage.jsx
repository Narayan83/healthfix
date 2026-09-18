import { useState } from "react";
import FormCard from "../../../components/layout/FormCard";
import { useAuth } from "../../../context/AuthContext";
import { changeMyPassword } from "./userService";

function extractError(err) {
  const data = err.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.error) return data.error;
  if (data?.message) return data.message;
  if (err.response?.status === 404) {
    return "Password change API is not available. Restart the backend server (go run main.go) and try again.";
  }
  return err.message || "Failed to change password";
}

export default function PasswordChangePage() {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const displayName = user
    ? `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.email
    : "Your account";

  const newPasswordOk = password.length >= 6;
  const confirmOk = passwordConfirm.length > 0 && password === passwordConfirm;
  const oldOk = oldPassword.length > 0;
  const differentOk = oldPassword !== password;

  const validationHint = !oldOk
    ? null
    : !newPasswordOk
      ? "New password must be at least 6 characters."
      : !confirmOk
        ? "Confirm password must match the new password."
        : !differentOk
          ? "New password must be different from your current password."
          : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPassword) {
      setError("Please enter your current password.");
      return;
    }
    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    if (password.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("New passwords do not match.");
      return;
    }
    if (oldPassword === password) {
      setError("New password must be different from your current password.");
      return;
    }

    setSaving(true);
    try {
      await changeMyPassword({
        old_password: oldPassword,
        password,
        password_confirm: passwordConfirm,
      });
      setSuccess("Password changed successfully. Use your new password next time you sign in.");
      setOldPassword("");
      setPassword("");
      setPasswordConfirm("");
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content">
      <div className="hf-page-card">
        <h2 className="page-title mb-1">Password Change</h2>
        <p className="page-subtitle mb-4">
          Update your login password. You must enter your current password to continue.
        </p>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && <div className="alert alert-success py-2">{success}</div>}

        <div className="hf-master-form-panel" style={{ maxWidth: 560 }}>
          <div className="mb-3 text-muted small">
            Signed in as <strong>{displayName}</strong>
            {user?.email ? ` (${user.email})` : ""}
          </div>

          <FormCard
            onSubmit={handleSubmit}
            footer={
              <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                {saving ? "Updating…" : "Change Password"}
              </button>
            }
          >
            <div className="row g-2">
              <div className="col-12">
                <label className="form-label">Current Password *</label>
                <input
                  type="password"
                  className="form-control"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">New Password *</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <div className="form-text">Minimum 6 characters.</div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Confirm New Password *</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              {validationHint && (
                <div className="col-12">
                  <div className="form-text text-warning">{validationHint}</div>
                </div>
              )}
            </div>
          </FormCard>
        </div>
      </div>
    </div>
  );
}
