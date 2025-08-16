// menuData.js
import { GiRingmaster } from "react-icons/gi";
import { MdOutlinePhonelinkSetup } from "react-icons/md";

export const menuItems = [
  {
    id: 1,
    title: "Masters",
    icon: GiRingmaster,
    submenu: [
      { title: "Product Master", path: "product-master" },
      { title: "Doctor Master", path: "doctor-master" },
      { title: "Chemist Master", path: "chemist-master" },
      { title: "Employee Master", path: "employee-master" },
      { title: "Designation Master", path: "designation-master" },
    ],
  },
  {
    id: 2,
    title: "Reports",
    icon: MdOutlinePhonelinkSetup,
    submenu: [{ title: "reports", path: "/" }],
  },
];
