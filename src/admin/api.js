import { getAdminToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE;

function assertApiBase() {
  if (!API_BASE) {
    throw new Error("VITE_API_BASE is not set. Create a .env with VITE_API_BASE=http://localhost:5001");
  }
}

export async function apiGet(path) {
  assertApiBase();
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(await safeReadError(res));
  return res.json();
}

export async function apiAdminJson(path, method, bodyObj) {
  assertApiBase();
  const token = getAdminToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(bodyObj ?? {}),
  });

  if (!res.ok) throw new Error(await safeReadError(res));
  return res.json();
}

export async function apiAdminForm(path, formData) {
  assertApiBase();
  const token = getAdminToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error(await safeReadError(res));
  return res.json();
}

async function safeReadError(res) {
  try {
    const data = await res.json();
    return data?.message || data?.error || `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}
