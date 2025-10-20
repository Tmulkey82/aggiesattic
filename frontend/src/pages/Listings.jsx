import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import AddListingModal from '../components/AddListingModal';
import './Listings.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

const Listings = () => {
  const navigate = useNavigate();
  const { isLoggedIn, login, logout, token } = useAuth();
  const [listings, setListings] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);

  useEffect(() => {
    axios.get(`${API_BASE}/api/listings`)
      .then(res => setListings(res.data))
      .catch(err => console.error('Failed to fetch listings', err));
  }, []);

  useEffect(() => {
    const openModal = () => setShowLoginModal(true);
    window.addEventListener('openAdminModal', openModal);
    return () => window.removeEventListener('openAdminModal', openModal);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, formData);
      login(res.data.token);
      setShowLoginModal(false);
      setFormData({ email: '', password: '' });
    } catch (err) {
      console.error(err);
      setError('Invalid credentials');
    }
  };

  const handleMainNav = (dir) => {
    const total = listings.length || 1;
    const newIndex = dir === 'left'
      ? (selectedIndex - 1 + total) % total
      : (selectedIndex + 1) % total;
    setSelectedIndex(newIndex);
  };

  const handleThumbNav = (dir) => {
    const windowSize = 5;
    const total = listings.length;
    if (total <= windowSize) return;

    if (dir === 'left') {
      setThumbStart((thumbStart - 1 + total) % total);
    } else {
      setThumbStart((thumbStart + 1) % total);
    }
  };

  const handleAddedListing = (newListing) => {
    setListings((prev) => [newListing, ...prev]);
    setSelectedIndex(0);
  };

  return (
    <div className="p-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          
          {isLoggedIn && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
            >
              + Create New Listing
            </button>
          )}
        </div>

        {isLoggedIn ? (
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700"
          >
            Log Out
          </button>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            Admin
          </button>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-6 text-center">Listings</h1>

      {/* Main Carousel Card */}
      {listings.length > 0 && (
        <div className="flex items-center justify-center mb-6 relative">
          <button onClick={() => handleMainNav('left')} className="carousel-arrow left-4">
            &lt;
          </button>

          <div
            className="w-full max-w-2xl bg-white rounded shadow overflow-hidden relative cursor-pointer"
            onClick={() => navigate(`/listings/${listings[selectedIndex]._id}`)}
          >
            <div className="relative overflow-hidden">
              <img
                src={listings[selectedIndex].imgUrl || (listings[selectedIndex].images?.[0] ?? '')}
                alt={listings[selectedIndex].title}
                className="w-full h-80 object-cover"
              />
              <div className="absolute bottom-0 w-full bg-black bg-opacity-50 text-white p-4">
                <h2 className="text-xl font-bold">{listings[selectedIndex].title}</h2>
                {typeof listings[selectedIndex].price !== 'undefined' && listings[selectedIndex].price !== null && (
                  <p className="text-lg">${listings[selectedIndex].price}</p>
                )}
              </div>
            </div>
          </div>

          <button onClick={() => handleMainNav('right')} className="carousel-arrow right-4">
            &gt;
          </button>
        </div>
      )}

      {/* Thumbnails */}
      {listings.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => handleThumbNav('left')} className="thumb-arrow">&lt;</button>
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: Math.min(5, listings.length) }).map((_, i) => {
              const realIndex = (thumbStart + i) % listings.length;
              const listing = listings[realIndex];
              const img = listing.images?.[listing.mainImageIndex || 0] || listing.images?.[0] || listing.imgUrl || '';
              return (
                <div
                  key={listing._id}
                  onClick={() => setSelectedIndex(realIndex)}
                  className={`w-[120px] bg-white rounded shadow border ${realIndex === selectedIndex ? 'border-orange-500' : 'border-transparent'}`}
                >
                  <img src={img} alt={`thumb-${realIndex}`} className="h-20 w-full object-cover rounded-t" />
                  <div className="px-2 py-1">
                    <h3 className="text-sm font-semibold truncate">{listing.title}</h3>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => handleThumbNav('right')} className="thumb-arrow">&gt;</button>
        </div>
      )}

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-4">Admin Login</h2>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border p-2 rounded"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border p-2 rounded"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="text-gray-500 hover:underline">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                  Log In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Listing Modal */}
      {isLoggedIn && (
        <AddListingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddedListing}
        />
      )}
    </div>
  );
};

export default Listings;
