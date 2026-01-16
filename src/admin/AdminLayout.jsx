import React from "react";
import { Outlet } from "react-router-dom";
import aggiesLogo from "../assets/aggies-logo.png";

export default function AdminLayout() {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <img
          src={aggiesLogo}
          alt="Aggie's Attic"
          style={{ maxWidth: 360, width: "100%", height: "auto" }}
        />
      </div>

      <Outlet />
    </div>
  );
}
