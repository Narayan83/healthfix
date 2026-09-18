/** Extract a useful message from an axios report API error. */
export function reportErrorMessage(err, fallback = "Failed to load") {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data?.error) return data.error;
  if (data?.message) return data.message;
  const status = err?.response?.status;
  if (status === 404) {
    return "Report API not found. Restart the backend server (go run main.go).";
  }
  if (status === 401) return "Session expired. Please log in again.";
  if (err?.message === "Network Error") {
    return "Cannot reach the server. Check that the backend is running on port 8000.";
  }
  return fallback;
}
