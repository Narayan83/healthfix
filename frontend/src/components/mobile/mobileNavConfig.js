import { GrDashboard } from "react-icons/gr";
import { FaClipboardList, FaUser, FaBars } from "react-icons/fa";

/** Bottom navigation for mobile / field representatives */
export const mobileNavItems = [
  { path: "/home", label: "Home", icon: GrDashboard, end: true },
  {
    path: "/daily-call-report",
    label: "Call Report",
    icon: FaClipboardList,
    primary: true,
    end: true,
  },
  { path: "/profile", label: "Profile", icon: FaUser, end: true },
];

export const mobileMenuToggleItem = {
  id: "menu",
  label: "Menu",
  icon: FaBars,
};
