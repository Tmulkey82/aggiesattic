import './index.css';
import logo from './assets/aggies-logo.png';
import aboutUs from './assets/agnes_about_us.png';
import { useState } from 'react';
import emailjs from '@emailjs/browser';

const inputStyle = {
  width: '100%',
  padding: '0.6rem',
  marginBottom: '10px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontSize: '1rem'
};

function App() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { firstName, lastName, phone } = formData;
    if (!firstName || !lastName || !phone) {
      setError('Please fill in all required fields.');
      return;
    }

    setError('');
    try {
      await emailjs.send(
        'service_w3wow1f',       // Replace with your EmailJS service ID
        'template_umzmvvk',      // Replace with your EmailJS template ID
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`, // feeds {{name}}
          time: new Date().toLocaleString(),                  // feeds {{time}}
          message: `This volunteer submission came from the Aggie’s Attic website.`
        },
        'dJ9MkGLeOpywjjXtm'        // Replace with your EmailJS public key
      );
      setSuccess(true);
      setFormData({ firstName: '', lastName: '', phone: '', email: '' });
    } catch (err) {
      setError('There was an error sending your request. Please try again later.');
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      {/* Logo and Tagline */}
      <img src={logo} alt="Aggies Attic logo" style={{ width: 320, maxWidth: '100%', marginBottom: 8 }} />
      <div style={{
        fontFamily: "'Pacifico', cursive, serif",
        fontSize: 24,
        color: "var(--color-walnut)",
        marginBottom: 2
      }}>
      </div>

      {/* About/Hours - 2 columns */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 48,
        maxWidth: 820,
        width: "100%",
        marginBottom: 40
      }}>
        {/* About Us */}
        <section style={{ flex: 1 }}>
          <img src={aboutUs} alt="Agnes About Us" style={{ width: 320, maxWidth: '100%', marginBottom: 8 }} />

          <p style={{ lineHeight: 1.6, marginBottom: 12 }}>
            <strong>Aggie’s Attic</strong> is a community thrift store run entirely by volunteers and supported through generous donations.
          </p>
          <p style={{ lineHeight: 1.6, marginBottom: 12 }}>
            With regular financial contributions from donors like you, we’re able to support local students and organizations throughout our community.
          </p>
          <p style={{ lineHeight: 1.6, marginBottom: 12 }}>
            <strong>All profits go directly toward:</strong>
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.6, marginBottom: 12 }}>
            <li>
              The <strong>Backpack Program</strong>, which provides food for over 150 local preschool and elementary students.
            </li>
            <li>
              The <strong>Scholarship Fund</strong>, offering assistance to students attending Hermitage Technical Center (The ACE Center).
            </li>
            <li>
              Community outreach programs including <strong>Greenwood UMC’s Food Donation Connection</strong>, <strong>United Methodist Family Services</strong>, and other local initiatives serving those in need.
            </li>
          </ul>
          <p style={{ lineHeight: 1.6 }}>
            Together, we’re making a difference—one donation at a time.
          </p>
        </section>

        {/* Hours & Location */}
        <section style={{
          flex: 1,
          background: "var(--color-sky)",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(120,80,40,0.06)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}>
          <h2 style={{ color: "var(--color-walnut)", marginBottom: 8 }}>Hours &amp; Location</h2>
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "120px auto", rowGap: 6, marginBottom: 16 }}>
              <div><strong>Sunday:</strong></div><div>CLOSED</div>
              <div><strong>Monday:</strong></div><div>CLOSED</div>
              <div><strong>Tuesday:</strong></div><div>CLOSED</div>
              <div><strong>Wednesday:</strong></div><div>11:00am – 4:00pm</div>
              <div><strong>Thursday:</strong></div><div>11:00am – 4:00pm</div>
              <div><strong>Friday:</strong></div><div>11:00am – 4:00pm</div>
              <div><strong>Saturday:</strong></div><div>11:00am – 4:00pm</div>
            </div>
            <br />
            <br />
            <br />
            <p style={{ marginBottom: 12 }}>
              <strong>The HUB Shopping Center</strong><br />
              <strong>6913 Lakeside Ave</strong><br />
              Henrico, VA
            </p>
            <div style={{
              width: "100%",
              height: 240,
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
            }}>
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
            boxShadow: "0 2px 4px rgba(100,80,40,0.10)"
          }}
        >
          Sign Up to Volunteer
        </button>
      </section>

      {/* Events */}
      <section style={{ width: "100%", maxWidth: 540, margin: "0 auto 48px auto" }}>
        <h2 style={{
          color: "var(--color-walnut)",
          borderBottom: "2px solid var(--color-taupe)",
          paddingBottom: 6,
          marginBottom: 16,
        }}>Events</h2>
        <div>
          <strong>Spring Sale</strong><br />
          Friday, April 12
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: "var(--color-taupe)",
        color: "white",
        padding: "1rem",
        textAlign: "center",
        borderRadius: 12,
        width: "90%",
        maxWidth: 800
      }}>
        <p>
          Follow us on <a href="https://www.facebook.com/profile.php?id=100057408972727" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-teal)', textDecoration: 'underline' }}>Facebook</a>
        </p>
        <p style={{ margin: 0, fontSize: 14 }}>
          &copy; {new Date().getFullYear()} Aggies Attic. All rights reserved.
        </p>
      </footer>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white', padding: 24, borderRadius: 12, width: '90%', maxWidth: 420,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', position: 'relative'
          }}>
            <button onClick={() => setShowModal(false)} style={{
              position: 'absolute', top: 8, right: 12, fontSize: 18, background: 'none', border: 'none', cursor: 'pointer'
            }}>
              &times;
            </button>
            <h3 style={{ marginBottom: 16, color: "var(--color-walnut)" }}>Volunteer Sign-Up</h3>
            {error && <p style={{ color: 'red', marginBottom: 8 }}>{error}</p>}
            {success && <p style={{ color: 'green', marginBottom: 8 }}>Thanks! Your info has been submitted.</p>}
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
              <button type="submit" style={{
                background: "var(--color-sage)",
                color: "var(--color-walnut)",
                padding: "0.7rem 1.5rem",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                marginTop: 12,
                cursor: "pointer"
              }}>
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
