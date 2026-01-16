import "./index.css";
import logo from "./assets/aggies-logo.png";
import aboutUs from "./assets/agnes_about_us.png";
import facebookIcon from "./assets/facebook_logo.svg";
import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";

import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./admin/AdminLayout.jsx";
import AdminLoginPage from "./admin/AdminLoginPage.jsx";
import AdminEventsPage from "./admin/AdminEventsPage.jsx";
import RequireAdmin from "./admin/RequireAdmin.jsx";

const API_BASE = import.meta.env.VITE_API_BASE;

const inputStyle = {
  width: "100%",
  padding: "0.6rem",
  marginBottom: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "1rem",
};

function formatDateRange(date, endDate) {
  const d1 = date ? new Date(date) : null;
  const d2 = endDate ? new Date(endDate) : null;

  const fmt = (d) =>
    d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (d1 && d2) return `${fmt(d1)} – ${fmt(d2)}`;
  if (d1) return fmt(d1);
  if (d2) return `Ends ${fmt(d2)}`;
  return "";
}

function PublicEvents() {
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");

    if (!API_BASE) {
      setError("Events are not configured yet (VITE_API_BASE is missing).");
      setBusy(false);
      return;
    }

    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}/api/events`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load events.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      style={{
        width: "100%",
        maxWidth: 720,
        margin: "0 auto 48px auto",
        background: "var(--color-sky)",
        padding: 20,
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(120,80,40,0.06)",
      }}
    >
      <h2 style={{ color: "var(--color-walnut)", marginBottom: 8 }}>Events</h2>

      {busy ? <div>Loading events…</div> : null}

      {!busy && error ? (
        <div style={{ color: "darkred" }}>
          <strong>Could not load events.</strong> {error}
        </div>
      ) : null}

      {!busy && !error && events.length === 0 ? <div>No upcoming events at the moment.</div> : null}

      {!busy && !error && events.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
          {events.map((ev) => {
            const dateLine = formatDateRange(ev.date, ev.endDate);

            return (
              <div
                key={ev._id}
                style={{
                  border: "1px solid rgba(0,0,0,0.12)",
                  borderRadius: 12,
                  padding: 14,
                  background: "rgba(255,255,255,0.65)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-walnut)" }}>
                  {ev.title}
                </div>

                {dateLine ? (
                  <div style={{ marginTop: 6, opacity: 0.85 }}>
                    <strong>Date:</strong> {dateLine}
                  </div>
                ) : null}

                <div style={{ marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {ev.description}
                </div>

                {Array.isArray(ev.images) && ev.images.length > 0 ? (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {ev.images.slice(0, 6).map((img) => (
                        <img
                          key={img._id}
                          src={img.url}
                          alt=""
                          style={{
                            width: 140,
                            height: 100,
                            objectFit: "cover",
                            borderRadius: 10,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.10)",
                          }}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function PublicHome() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { firstName, lastName, phone } = formData;
    if (!firstName || !lastName || !phone) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    try {
      await emailjs.send(
        "service_w3wow1f",
        "template_umzmvvk",
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          time: new Date().toLocaleString(),
          message: `This volunteer submission came from the Aggie’s Attic website.`,
        },
        "dJ9MkGLeOpywjjXtm"
      );
      setSuccess(true);
      setFormData({ firstName: "", lastName: "", phone: "", email: "" });
    } catch {
      setError("There was an error sending your request. Please try again later.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Logo and Tagline */}
      <img src={logo} alt="Aggies Attic logo" style={{ width: 320, maxWidth: "100%", marginBottom: 8 }} />
      <div
        style={{
          fontFamily: "'Pacifico', cursive, serif",
          fontSize: 24,
          color: "var(--color-walnut)",
          marginBottom: 2,
        }}
      ></div>

      {/* About/Hours - 2 columns */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 48,
          maxWidth: 820,
          width: "100%",
          marginBottom: 40,
        }}
      >
        {/* About Us */}
        <section style={{ flex: 1 }}>
          <img src={aboutUs} alt="Agnes About Us" style={{ width: 320, maxWidth: "100%", marginBottom: 8 }} />

          <p style={{ lineHeight: 1.6, marginBottom: 12 }}>
            <strong>Aggie’s Attic</strong> is a community thrift store run entirely by volunteers and supported through
            generous donations.
          </p>
          <p style={{ lineHeight: 1.6, marginBottom: 12 }}>
            With regular financial contributions from donors like you, we’re able to support local students and
            organizations throughout our community.
          </p>
          <p style={{ lineHeight: 1.6, marginBottom: 12 }}>
            <strong>All profits go directly toward:</strong>
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.6, marginBottom: 12 }}>
            <li>
              The <strong>Backpack Program</strong>, which provides food for over 150 local preschool and elementary
              students.
            </li>
            <li>
              The <strong>Scholarship Fund</strong>, offering assistance to students attending Hermitage Technical
              Center (The ACE Center).
            </li>
            <li>
              Community outreach programs including <strong>Greenwood UMC’s Food Donation Connection</strong>,{" "}
              <strong>United Methodist Family Services</strong>, and other local initiatives serving those in need.
            </li>
          </ul>
          <p style={{ lineHeight: 1.6 }}>Together, we’re making a difference—one donation at a time.</p>
        </section>

        {/* Hours & Location */}
        <section
          style={{
            flex: 1,
            background: "var(--color-sky)",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(120,80,40,0.06)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h2 style={{ color: "var(--color-walnut)", marginBottom: 8 }}>Hours &amp; Location</h2>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "120px auto", rowGap: 6, marginBottom: 16 }}>
              <div>
                <strong>Sunday:</strong>
              </div>
              <div>CLOSED</div>
              <div>
                <strong>Monday:</strong>
              </div>
              <div>CLOSED</div>
              <div>
                <strong>Tuesday:</strong>
              </div>
              <div>CLOSED</div>
              <div>
                <strong>Wednesday:</strong>
              </div>
              <div>11:00am – 4:00pm</div>
              <div>
                <strong>Thursday:</strong>
              </div>
              <div>11:00am – 4:00pm</div>
              <div>
                <strong>Friday:</strong>
              </div>
              <div>11:00am – 4:00pm</div>
              <div>
                <strong>Saturday:</strong>
              </div>
              <div>11:00am – 4:00pm</div>
            </div>
            <br />
            <br />
            <br />
            <p style={{ marginBottom: 12 }}>
              <strong>The HUB Shopping Center</strong>
              <br />
              <strong>6913 Lakeside Ave</strong>
              <br />
              Henrico, VA
            </p>
            <div
              style={{
                width: "100%",
                height: 240,
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              }}
            >
              <iframe
                title="Aggie's Attic Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3110.021824492644!2d-77.48964272376462!3d37.61125787202621!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b116eb12914955%3A0x5dd9e1a9ae77c944!2s6913%20Lakeside%20Ave%2C%20Henrico%2C%20VA%2023228!5e0!3m2!1sen!2sus!4v1721130099613!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </section>
      </div>

      {/* Volunteer */}
      <section style={{ textAlign: "center", width: "100%", marginBottom: 40 }}>
        <h2 style={{ color: "var(--color-walnut)", marginBottom: 16 }}></h2>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "var(--color-sage)",
            color: "var(--color-walnut)",
            border: "none",
            padding: "0.9rem 2.2rem",
            borderRadius: 8,
            fontSize: 20,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(100,80,40,0.10)",
          }}
        >
          Sign Up to Volunteer
        </button>
      </section>

      {/* Events (PUBLIC) — now DB-driven */}
      <PublicEvents />

      {/* Footer */}
      <footer
        style={{
          background: "#8b5e3c",
          color: "white",
          padding: "1rem",
          textAlign: "center",
          borderRadius: 12,
          width: "90%",
          maxWidth: 800,
        }}
      >
        <p>
          Follow us on <img src={facebookIcon} alt="Facebook" style={{ width: 20, height: 20 }} />
          <a
            href="https://www.facebook.com/profile.php?id=100057408972727"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-teal)", textDecoration: "underline" }}
          >
            Facebook
          </a>
          <br />
          Follow Aggie's Attic Furniture Shed on{" "}
          <img src={facebookIcon} alt="Facebook" style={{ width: 20, height: 20 }} />
          <a
            href="https://www.facebook.com/profile.php?id=100070282226048"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-teal)", textDecoration: "underline" }}
          >
            Facebook
          </a>
        </p>
        <p style={{ margin: 0, fontSize: 14 }}>
          &copy; {new Date().getFullYear()} Aggie's Attic. All rights reserved.
        </p>
      </footer>

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              width: "90%",
              maxWidth: 420,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: 8,
                right: 12,
                fontSize: 18,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              &times;
            </button>
            <h3 style={{ marginBottom: 16, color: "var(--color-walnut)" }}>Volunteer Sign-Up</h3>
            {error && <p style={{ color: "red", marginBottom: 8 }}>{error}</p>}
            {success && <p style={{ color: "green", marginBottom: 8 }}>Thanks! Your info has been submitted.</p>}
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="firstName"
                placeholder="First Name *"
                value={formData.firstName}
                onChange={handleChange}
                required
                style={inputStyle}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name *"
                value={formData.lastName}
                onChange={handleChange}
                required
                style={inputStyle}
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number *"
                value={formData.phone}
                onChange={handleChange}
                required
                style={inputStyle}
              />
              <input
                type="email"
                name="email"
                placeholder="Email (optional)"
                value={formData.email}
                onChange={handleChange}
                style={inputStyle}
              />
              <button
                type="submit"
                style={{
                  background: "var(--color-sage)",
                  color: "var(--color-walnut)",
                  padding: "0.7rem 1.5rem",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  marginTop: 12,
                  cursor: "pointer",
                }}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PublicHome />} />

      {/* Admin (logo + events only) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminLoginPage />} />
        <Route
          path="events"
          element={
            <RequireAdmin>
              <AdminEventsPage />
            </RequireAdmin>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
