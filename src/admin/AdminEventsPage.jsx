import React, { useEffect, useMemo, useState } from "react";
import { apiAdminForm, apiAdminJson, apiGet } from "./api";
import { clearAdminToken } from "./auth";
import { useNavigate } from "react-router-dom";

function formatDateInputValue(dateValue) {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminEventsPage() {
  const nav = useNavigate();
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
  });

  const [files, setFiles] = useState(null);

  const isEditing = useMemo(() => !!editingId, [editingId]);

  async function loadEvents() {
    setError("");
    try {
      const data = await apiGet("/api/events");
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load events.");
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function startCreate() {
    setEditingId("NEW");
    setForm({ title: "", description: "", date: "", endDate: "" });
    setFiles(null);
    setError("");
  }

  function startEdit(ev) {
    setEditingId(ev._id);
    setForm({
      title: ev.title || "",
      description: ev.description || "",
      date: formatDateInputValue(ev.date),
      endDate: formatDateInputValue(ev.endDate),
    });
    setFiles(null);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ title: "", description: "", date: "", endDate: "" });
    setFiles(null);
    setError("");
  }

  async function saveEvent() {
    setBusy(true);
    setError("");

    try {
      const payload = {
        title: form.title,
        description: form.description,
        date: form.date ? new Date(form.date).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };

      let saved;
      if (editingId === "NEW") {
        saved = await apiAdminJson("/api/events", "POST", payload);
      } else {
        saved = await apiAdminJson(`/api/events/${editingId}`, "PUT", payload);
      }

      // Upload images if selected
      if (files && files.length > 0) {
        const fd = new FormData();
        for (const f of files) fd.append("images", f);
        await apiAdminForm(`/api/events/${saved._id}/images`, fd);
      }

      await loadEvents();
      cancelEdit();
    } catch (err) {
      setError(err.message || "Failed to save event.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteEvent(eventId) {
    const ok = window.confirm("Delete this event? This cannot be undone.");
    if (!ok) return;

    setBusy(true);
    setError("");
    try {
      await apiAdminJson(`/api/events/${eventId}`, "DELETE", {});
      await loadEvents();
    } catch (err) {
      setError(err.message || "Failed to delete event.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteImage(eventId, imageId) {
    const ok = window.confirm("Delete this image?");
    if (!ok) return;

    setBusy(true);
    setError("");
    try {
      await apiAdminJson(`/api/events/${eventId}/images/${imageId}`, "DELETE", {});
      await loadEvents();
    } catch (err) {
      setError(err.message || "Failed to delete image.");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    clearAdminToken();
    nav("/admin", { replace: true });
  }

  return (
    <div style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 10, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Manage Events</h2>
        <button onClick={logout} style={{ padding: "8px 12px", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      {error ? (
        <div style={{ marginTop: 12, marginBottom: 12, color: "darkred" }}>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <div style={{ marginTop: 12, marginBottom: 18, display: "flex", gap: 10 }}>
        <button onClick={startCreate} style={{ padding: "10px 14px", cursor: "pointer" }}>
          Add New Event
        </button>
        <button onClick={loadEvents} disabled={busy} style={{ padding: "10px 14px", cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {/* Editor */}
      {isEditing ? (
        <div style={{ border: "1px solid rgba(0,0,0,.15)", borderRadius: 10, padding: 16, marginBottom: 18 }}>
          <h3 style={{ marginTop: 0 }}>{editingId === "NEW" ? "Create Event" : "Edit Event"}</h3>

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", marginBottom: 6 }}>Title (required)</label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              style={{ width: "100%", padding: 10 }}
              required
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", marginBottom: 6 }}>Description (required)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              style={{ width: "100%", padding: 10, minHeight: 140 }}
              required
            />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ flex: "1 1 220px" }}>
              <label style={{ display: "block", marginBottom: 6 }}>Start Date (optional)</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                style={{ width: "100%", padding: 10 }}
              />
            </div>
            <div style={{ flex: "1 1 220px" }}>
              <label style={{ display: "block", marginBottom: 6 }}>End Date (optional)</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                style={{ width: "100%", padding: 10 }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6 }}>Images (optional)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(e.target.files)}
            />
            <div style={{ marginTop: 6, opacity: 0.8 }}>
              You can select multiple images. They will upload after you save the event.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={saveEvent} disabled={busy} style={{ padding: "10px 14px", cursor: "pointer" }}>
              {busy ? "Saving..." : "Save"}
            </button>
            <button onClick={cancelEdit} disabled={busy} style={{ padding: "10px 14px", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {/* Event list */}
      <div>
        {events.length === 0 ? (
          <div>No events yet.</div>
        ) : (
          events.map((ev) => (
            <div
              key={ev._id}
              style={{
                border: "1px solid rgba(0,0,0,.12)",
                borderRadius: 10,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{ev.title}</div>
                  <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{ev.description}</div>

                  <div style={{ marginTop: 10, opacity: 0.8 }}>
                    {renderDateRange(ev.date, ev.endDate)}
                  </div>

                  {/* Images */}
                  {Array.isArray(ev.images) && ev.images.length > 0 ? (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>Images</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {ev.images.map((img) => (
                          <div key={img._id} style={{ width: 140 }}>
                            <img
                              src={img.url}
                              alt=""
                              style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }}
                            />
                            <button
                              onClick={() => deleteImage(ev._id, img._id)}
                              disabled={busy}
                              style={{ marginTop: 6, width: "100%", padding: "6px 8px", cursor: "pointer" }}
                            >
                              Delete Image
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button onClick={() => startEdit(ev)} disabled={busy} style={{ padding: "8px 12px", cursor: "pointer" }}>
                    Edit
                  </button>
                  <button
                    onClick={() => deleteEvent(ev._id)}
                    disabled={busy}
                    style={{ padding: "8px 12px", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function renderDateRange(date, endDate) {
  const d1 = date ? new Date(date) : null;
  const d2 = endDate ? new Date(endDate) : null;

  const fmt = (d) =>
    d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  if (d1 && d2) return `Date: ${fmt(d1)} – ${fmt(d2)}`;
  if (d1) return `Date: ${fmt(d1)}`;
  if (d2) return `End Date: ${fmt(d2)}`;
  return "";
}
