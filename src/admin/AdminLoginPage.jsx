import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAdminToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function AdminLoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (!API_BASE) throw new Error("VITE_API_BASE is not set.");

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const msg = await safeReadError(res);
        throw new Error(msg);
      }

      const data = await res.json();
      if (!data?.token) throw new Error("Login did not return a token.");

      setAdminToken(data.token);
      nav("/admin/events", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 10, padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>Admin Login</h2>

      {error ? (
        <div style={{ marginBottom: 12, color: "darkred" }}>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="username"
            required
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
            style={{ width: "100%", padding: 10 }}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{ padding: "10px 14px", cursor: busy ? "not-allowed" : "pointer" }}
        >
          {busy ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

async function safeReadError(res) {
  try {
    const data = await res.json();
    return data?.message || data?.error || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}
