import { GiRingmaster } from "react-icons/gi";
import { MdOutlinePhonelinkSetup, MdAdminPanelSettings } from "react-icons/md";
import { FaUserMd, FaPills, FaBoxOpen, FaBriefcase, FaUsers, FaExchangeAlt } from "react-icons/fa";

export const menuItems = [
  {
    id: 9,
    title: "Transaction",
    icon: FaExchangeAlt,
    submenu: [{ title: "Daily Call Report", path: "/daily-call-report" }],
  },
  {
    id: 1,
    title: "Masters",
    icon: GiRingmaster,
    submenu: [
      { title: "Product Master", path: "/Product-master" },
      { title: "Doctor Master", path: "/Doctor-master" },
      { title: "Chemist Master", path: "/chemist-master" },
      { title: "Designation Master", path: "/Designation-master" },
      { title: "Head Quarter Master", path: "/head-quarter-master" },
      { title: "Stockist Master", path: "/stockist-master" },
      { title: "Promotion Item Master", path: "/promotion-item-master" },
      { title: "Promotion Stock", path: "/promotion-stock" },
    ],
  },
  {
    id: 2,
    title: "Reports",
    icon: MdOutlinePhonelinkSetup,
    submenu: [
      { title: "Daily Call Submissions", path: "/reports/daily-call-submissions" },
      { title: "Order Products", path: "/reports/order-products" },
      { title: "Doctor Visits", path: "/reports/doctor-visits" },
      { title: "Promotion Stock", path: "/reports/promotion-stock" },
    ],
  },
  {
    id: 7,
    title: "Menu Management",
    icon: MdAdminPanelSettings,
    submenu: [
      { title: "Role Creation", path: "/rolecreation" },
      { title: "Role Management", path: "/rolemanagement" },
      { title: "Menu Creation", path: "/menucreation" },
      { title: "Existing Menus", path: "/existingmenus" },
      { title: "Audit Logs", path: "/auditlogs" },
    ],
  },
  {
    id: 8,
    title: "User Management",
    icon: FaUsers,
    submenu: [
      { title: "User Management", path: "/usermanagement" },
      { title: "Add User", path: "/adduser" },
      { title: "Representative Master", path: "/representative-master" },
      { title: "Password Change", path: "/change-password" },
    ],
  },
];

export const masterIcons = {
  product: FaBoxOpen,
  doctor: FaUserMd,
  chemist: FaPills,
  designation: FaBriefcase,
};
