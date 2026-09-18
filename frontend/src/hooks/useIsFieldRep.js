import { useAuth } from "../context/AuthContext";

/** User linked to a representative master (field/mobile use). */
export default function useIsFieldRep() {
  const { user } = useAuth();
  if (!user) {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      return Boolean(stored?.representative_id);
    } catch {
      return false;
    }
  }
  return Boolean(user.representative_id);
}
