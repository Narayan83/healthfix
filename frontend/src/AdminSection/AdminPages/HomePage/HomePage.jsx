import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../../../components/layout/PageLayout";
import useIsFieldRep from "../../../hooks/useIsFieldRep";
import useIsMobile from "../../../hooks/useIsMobile";
import { FaBoxOpen, FaUserMd, FaPills, FaBriefcase, FaClipboardList } from "react-icons/fa";

const cards = [
  { title: "Product Master", desc: "Manage products and categories", path: "/Product-master", Icon: FaBoxOpen },
  { title: "Doctor Master", desc: "Doctor profiles and departments", path: "/Doctor-master", Icon: FaUserMd },
  { title: "Chemist Master", desc: "Chemist and pharmacy records", path: "/chemist-master", Icon: FaPills },
  { title: "Designation Master", desc: "Job titles and designations", path: "/Designation-master", Icon: FaBriefcase },
];

export default function HomePage() {
  const isRep = useIsFieldRep();
  const isMobile = useIsMobile();

  return (
    <PageLayout
      title={isRep ? "Field dashboard" : "Dashboard"}
      subtitle={
        isRep
          ? "Use Call Report from the bottom menu to file today's visit."
          : "Welcome to HealthFix. Quick access to master data modules."
      }
    >
      {(isRep || isMobile) && (
        <Link to="/daily-call-report" className="hf-dashboard-tile mb-3 d-block" style={{ textDecoration: "none" }}>
          <div className="hf-dashboard-tile__icon">
            <FaClipboardList />
          </div>
          <h2 className="hf-dashboard-tile__title">Daily Call Report</h2>
          <p className="hf-dashboard-tile__desc">Report, leave, holiday — orders & promotion items</p>
        </Link>
      )}

      {!isRep && (
        <div className="hf-dashboard-grid">
          {cards.map(({ title, desc, path, Icon }) => (
            <Link to={path} className="hf-dashboard-tile" key={path}>
              <div className="hf-dashboard-tile__icon">
                <Icon />
              </div>
              <h2 className="hf-dashboard-tile__title">{title}</h2>
              <p className="hf-dashboard-tile__desc">{desc}</p>
            </Link>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
