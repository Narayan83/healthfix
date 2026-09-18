import React from "react";

export default function PageLayout({ title, subtitle, children, actions, className = "" }) {
  return (
    <div className={`page-content hf-page ${className}`.trim()}>
      <div className="hf-content-container">
        <header className="hf-page-hero">
          <div className="hf-page-hero__titles">
            <h1 className="hf-page-hero__title">{title}</h1>
            {subtitle && <p className="hf-page-hero__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="hf-page-hero__actions">{actions}</div>}
        </header>
        <div className="hf-page-body">{children}</div>
      </div>
    </div>
  );
}
