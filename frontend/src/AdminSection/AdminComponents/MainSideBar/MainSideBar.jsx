import React, { useEffect, useState } from "react";
import { MdKeyboardArrowRight, MdKeyboardArrowDown } from "react-icons/md";
import { GrDashboard } from "react-icons/gr";
import { NavLink, useLocation } from "react-router-dom";
import { menuItems } from "../../MenuData/MenuData";
import { useAuth } from "../../../context/AuthContext";

function findParentIdByPath(items, pathname) {
  const parent = items.find((item) =>
    item.children?.some((child) => child.url === pathname)
  );
  return parent?.id ?? null;
}

function iconFor(menu) {
  const configured = menuItems.find(
    (item) => item.title === menu.menu_name || item.path === menu.url
  );
  return configured?.icon;
}

const MainSideBar = () => {
  const location = useLocation();
  const { menus, menusLoading } = useAuth();
  const [selected, setSelected] = useState(location.pathname);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    setSelected(location.pathname);
    const parentId = findParentIdByPath(menus, location.pathname);
    if (parentId != null) setOpenId(parentId);
  }, [location.pathname, menus]);

  const selectMenu = (key, parentId = null) => {
    setSelected(key);
    if (parentId != null) setOpenId(parentId);
    else setOpenId(null);
  };

  const toggleSubmenu = (item) => {
    const key = `parent:${item.id}`;
    selectMenu(key);
    setOpenId((prev) => (prev === item.id ? null : item.id));
  };

  return (
    <nav className="sidebar">
      <ul className="list-unstyled mb-0">
        {!menusLoading && menus.map((item) => {
          const Icon = item.url === "/home" ? GrDashboard : iconFor(item);
          const parentKey = `parent:${item.id}`;
          const isExpanded = openId === item.id;

          if (item.children?.length) {
            return (
              <li className="nav-item" key={item.id}>
                <button
                  type="button"
                  className={`nav-btn ${selected === parentKey ? "active" : ""}`}
                  onClick={() => toggleSubmenu(item)}
                >
                  <span className="icon">{Icon && <Icon />}</span>
                  {item.menu_name}
                  <span className="arrow-right">
                    {isExpanded ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />}
                  </span>
                </button>
                <div className={`sub-menu-wraper ${isExpanded ? "colapse" : "colapsed"}`}>
                  <ul className="submenu list-unstyled">
                    {item.children.map((sub) => (
                      <li key={sub.id}>
                        <NavLink
                          to={sub.url}
                          end
                          className={() =>
                            `submenu-link ${selected === sub.url ? "active" : ""}`
                          }
                          onClick={() => selectMenu(sub.url, item.id)}
                        >
                          {sub.menu_name}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          }

          return (
            <li className="nav-item" key={item.id}>
              <NavLink
                to={item.url}
                end
                className={() =>
                  `nav-link ${selected === item.url ? "active" : ""}`
                }
                onClick={() => selectMenu(item.url)}
              >
                <span className="icon">{Icon && <Icon />}</span>
                {item.menu_name}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MainSideBar;
