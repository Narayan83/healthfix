import { createContext, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import useIsMobile from "./hooks/useIsMobile";
import MobileBottomNav from "./components/mobile/MobileBottomNav";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { menuItems } from "./AdminSection/MenuData/MenuData";
import "./styles/main.scss";
import Header from "./AdminSection/AdminComponents/Header/Header";
import MainSideBar from "./AdminSection/AdminComponents/MainSideBar/MainSideBar";

import HomePage from "./AdminSection/AdminPages/HomePage/HomePage";
import DailyCallSubmissionsReportPage from "./pages/Reports/DailyCallSubmissionsReportPage";
import OrderProductsReportPage from "./pages/Reports/OrderProductsReportPage";
import DoctorVisitsReportPage from "./pages/Reports/DoctorVisitsReportPage";
import PromotionStockReportPage from "./pages/Reports/PromotionStockReportPage";
import LoginPage from "./AdminSection/AdminPages/Login/Login";
import Profile from "./AdminSection/AdminPages/Profile/Profile";
import NotFoundPage from "./AdminSection/AdminPages/NotFoundPage/NotFoundPage";

import ExistingMenus from "./pages/MenuManagement/page/ExistingMenus/ExistingMenus";
import ExistingRoles from "./pages/MenuManagement/page/ExistingRoles/ExistingRoles";
import AuditLogs from "./pages/MenuManagement/page/AuditLogs/AuditLogs";
import RoleList from "./pages/UserManagement/Roles/RoleList";
import MenuCreationPage from "./pages/MenuManagement/page/MenuCreation/MenuCreationPage";
import RoleMappingtoMenus from "./pages/MenuManagement/page/RoleMappingtoMenus/RoleMappingtoMenus";
import UserList from "./pages/UserManagement/users/UserList";
import PasswordChangePage from "./pages/UserManagement/users/PasswordChangePage";
import UserRoleMappingPage from "./pages/UserManagement/UserRoleMapping/UserRoleMappingPage";

import ChemistMaster from "./pages/ChemistMaster/ChemistMaster";
import DesignationMaster from "./pages/DesignationMaster/DesignationMaster";
import ProductMaster from "./pages/ProductMaster/ProductMaster";
import DoctorMaster from "./pages/DoctorMaster/DoctorMaster";
import AreaMaster from "./pages/AreaMaster/AreaMaster";
import StockistMaster from "./pages/StockistMaster/StockistMaster";
import RepresentativeMaster from "./pages/RepresentativeMaster/RepresentativeMaster";
import PromotionItemMaster from "./pages/PromotionItemMaster/PromotionItemMaster";
import PromotionStock from "./pages/PromotionStock/PromotionStock";
import DailyCallReport from "./pages/DailyCallReport/DailyCallReport";

const myContext = createContext();

const normalizePath = (path) => path.toLowerCase().replace(/\/+$/, "") || "/";
const menuControlledPaths = new Set([
  "/home",
  "/password-change",
  ...menuItems.flatMap((item) => [
    ...(item.path ? [item.path] : []),
    ...(item.submenu?.map((sub) => sub.path) || []),
  ]),
].map(normalizePath));
const permissionPathAliases = {
  "/password-change": "/change-password",
};

function AppLayout({ children }) {
  const isMobile = useIsMobile();
  const { token, menusLoading, hasMenuAccess, getFirstMenuPath } = useAuth();
  const [isToggleSideBar, setIsToggleSideBar] = useState(false);
  const values = { isToggleSideBar, setIsToggleSideBar };

  const location = useLocation();
  const noLayoutRoutes = ["/", "/login"];
  const isNoLayout = noLayoutRoutes.includes(location.pathname);

  useEffect(() => {
    if (isMobile) {
      setIsToggleSideBar(true);
    }
  }, [isMobile]);

  const sidebarOpen = isMobile && !isToggleSideBar;

  if (isNoLayout) {
    return <myContext.Provider value={values}>{children}</myContext.Provider>;
  }

  if (!token) return <Navigate to="/login" replace />;

  const isMenuControlled = menuControlledPaths.has(normalizePath(location.pathname));
  if (isMenuControlled && menusLoading) return null;
  const permissionPath =
    permissionPathAliases[normalizePath(location.pathname)] || location.pathname;
  if (isMenuControlled && !hasMenuAccess(permissionPath)) {
    return <Navigate to={getFirstMenuPath() || "/profile"} replace />;
  }

  return (
    <myContext.Provider value={values}>
      <div className="hf-app">
        <Header />
        <div className="hf-body">
          {isMobile && (
            <button
              type="button"
              className={`hf-sidebar-backdrop${sidebarOpen ? " is-visible" : ""}`}
              aria-label="Close menu"
              onClick={() => setIsToggleSideBar(true)}
            />
          )}
          <aside className={`hf-sidebar ${isToggleSideBar ? "is-collapsed" : ""}`}>
            <MainSideBar />
          </aside>
          <main
            className={`hf-main ${isToggleSideBar ? "sidebar-collapsed" : ""}${
              isMobile ? " hf-main--mobile-nav" : ""
            }`}
          >
            {children}
          </main>
          {isMobile && (
            <MobileBottomNav onOpenMenu={() => setIsToggleSideBar(false)} />
          )}
        </div>
      </div>
    </myContext.Provider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/home" element={<HomePage />} />
          <Route path="/reports" element={<Navigate to="/reports/daily-call-submissions" replace />} />
          <Route path="/reports/daily-call-submissions" element={<DailyCallSubmissionsReportPage />} />
          <Route path="/reports/order-products" element={<OrderProductsReportPage />} />
          <Route path="/reports/doctor-visits" element={<DoctorVisitsReportPage />} />
          <Route path="/reports/promotion-stock" element={<PromotionStockReportPage />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/rolecreation" element={<RoleList />} />
          <Route path="/existingroles" element={<ExistingRoles />} />
          <Route path="/rolemanagement" element={<RoleMappingtoMenus />} />
          <Route path="/menucreation" element={<MenuCreationPage />} />
          <Route path="/existingmenus" element={<ExistingMenus />} />
          <Route path="/usermanagement" element={<UserRoleMappingPage />} />
          <Route path="/adduser" element={<UserList />} />
          <Route path="/change-password" element={<PasswordChangePage />} />
          <Route path="/password-change" element={<PasswordChangePage />} />
          <Route path="/representative-master" element={<RepresentativeMaster />} />
          <Route path="/auditlogs" element={<AuditLogs />} />

          <Route path="/chemist-master" element={<ChemistMaster />} />
          <Route path="/stockist-master" element={<StockistMaster />} />
          <Route path="/Designation-master" element={<DesignationMaster />} />
          <Route path="/Doctor-master" element={<DoctorMaster />} />
          <Route path="/area-master" element={<AreaMaster />} />
          <Route path="/head-quarter-master" element={<AreaMaster />} />
          <Route path="/Product-master" element={<ProductMaster />} />
          <Route path="/product-master" element={<ProductMaster />} />
          <Route path="/promotion-item-master" element={<PromotionItemMaster />} />
          <Route path="/promotion-stock" element={<PromotionStock />} />
          <Route path="/daily-call-report" element={<DailyCallReport />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
export { myContext };
