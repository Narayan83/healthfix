import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function useMenuPermissions(pathOverride) {
  const { getPermissions } = useAuth();
  const location = useLocation();
  return getPermissions(pathOverride ?? location.pathname);
}
