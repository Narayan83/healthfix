import { NavLink, useLocation } from "react-router-dom";
import { mobileMenuToggleItem, mobileNavItems } from "./mobileNavConfig";
import { useAuth } from "../../context/AuthContext";

export default function MobileBottomNav({ onOpenMenu }) {
  const location = useLocation();
  const { hasMenuAccess } = useAuth();
  const visibleItems = mobileNavItems.filter(
    (item) => item.path === "/profile" || hasMenuAccess(item.path)
  );

  return (
    <nav className="hf-mobile-nav" aria-label="Mobile navigation">
      {visibleItems.map(({ path, label, icon: Icon, primary, end }) => (
        <NavLink
          key={path}
          to={path}
          end={end}
          className={({ isActive }) =>
            `hf-mobile-nav__item${primary ? " hf-mobile-nav__item--primary" : ""}${
              isActive ? " is-active" : ""
            }`
          }
        >
          <span className="hf-mobile-nav__icon">
            <Icon />
          </span>
          <span className="hf-mobile-nav__label">{label}</span>
        </NavLink>
      ))}
      <button
        type="button"
        className={`hf-mobile-nav__item hf-mobile-nav__item--menu${
          location.pathname !== "/daily-call-report" &&
          location.pathname !== "/home" &&
          location.pathname !== "/profile"
            ? " is-active"
            : ""
        }`}
        onClick={onOpenMenu}
        aria-label="Open menu"
      >
        <span className="hf-mobile-nav__icon">
          <mobileMenuToggleItem.icon />
        </span>
        <span className="hf-mobile-nav__label">{mobileMenuToggleItem.label}</span>
      </button>
    </nav>
  );
}
