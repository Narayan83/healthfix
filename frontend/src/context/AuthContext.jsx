import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../Config";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [menus, setMenus] = useState([]);
  const [menusLoading, setMenusLoading] = useState(!!localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMenus = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setMenus([]);
      setMenusLoading(false);
      return;
    }
    setMenusLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/api/my-menus`);
      setMenus(response.data || []);
    } catch (error) {
      console.error("Failed to fetch menus", error);
      setMenus([]);
    } finally {
      setMenusLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse stored user", e);
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      fetchMenus();
    } else {
      setMenus([]);
    }
  }, [token, fetchMenus]);

  useEffect(() => {
    const onMenusChanged = () => fetchMenus();
    window.addEventListener("menuCreated", onMenusChanged);
    window.addEventListener("menusUpdated", onMenusChanged);
    return () => {
      window.removeEventListener("menuCreated", onMenusChanged);
      window.removeEventListener("menusUpdated", onMenusChanged);
    };
  }, [fetchMenus]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      localStorage.setItem("isAuthenticated", "true");
      setMenusLoading(true);
      setToken(data.token);
      setUser(data.user);
      const isRep = Boolean(data.user?.representative_id);
      navigate(isRep ? "/daily-call-report" : "/home");
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setMenus([]);
    setMenusLoading(false);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  const normalizePath = (p) => {
    if (p == null || typeof p !== "string") return "";
    const normalized = p.toLowerCase();
    if (normalized.length > 1 && normalized.endsWith("/")) return normalized.slice(0, -1);
    return normalized;
  };

  const getPermissions = (path) => {
    const needle = normalizePath(path);
    let perms = null;
    const find = (items) => {
      for (const item of items) {
        if (normalizePath(item.url) === needle) {
          perms = item.permissions;
          return true;
        }
        if (item.children?.length > 0 && find(item.children)) return true;
      }
      return false;
    };
    find(menus);
    // null = route not in permission tree (e.g. new menu) — callers may allow actions by default
    return perms ?? null;
  };

  const hasMenuAccess = (path) => getPermissions(path)?.can_view === true;

  const getFirstMenuPath = () => {
    const findPath = (items) => {
      for (const item of items) {
        if (item.children?.length) {
          const childPath = findPath(item.children);
          if (childPath) return childPath;
        }
        if (item.url?.startsWith("/")) return item.url;
      }
      return null;
    };
    return findPath(menus);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        menus,
        menusLoading,
        getPermissions,
        hasMenuAccess,
        getFirstMenuPath,
        refetchMenus: fetchMenus,
        loading,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
