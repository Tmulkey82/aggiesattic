import React from "react";
import { Navigate } from "react-router-dom";
import { getAdminToken } from "./auth";

export default function RequireAdmin({ children }) {
  const token = getAdminToken();
  if (!token) return <Navigate to="/admin" replace />;
  return children;
}
