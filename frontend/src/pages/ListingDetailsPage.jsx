// ListingDetailsPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ListingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, token } = useAuth();
  const [listing, setListing] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedImages, setSelectedImages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      const res = await axios.get(`http://localhost:5001/api/listings/${id}`);
      setListing(res.data);
      setFormData({
        title: res.data.title,
        description: res.data.description,
        price: res.data.price,
        imageUrls: res.data.images || [],
      });
    };
    fetchListing();
  }, [id]);

  const handleDeleteListing = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this listing?');
    if (!confirmed) return;
    await axios.delete(`http://localhost:5001/api/listings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    navigate('/');
  };

  const handleDeleteImage = async (index) => {
    try {
      const res = await axios.delete(`http://localhost:5001/api/listings/${id}/image/${index}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setListing(res.data.listing);
      setFormData((prev) => ({
        ...prev,
        imageUrls: res.data.listing.images,
      }));
    } catch (err) {
      console.error('Failed to delete image', err);
    }
  };

  const handleFileChange = (e) => {
    setSelectedImages([...e.target.files]);
  };

  const handleSave = async () => {
    let imageUrls = [...formData.imageUrls];

    for (const image of selectedImages) {
      const data = new FormData();
      data.append('file', image);
      data.append('upload_preset', 'aggies_attic_shed');
      data.append('folder', 'aggies-attic');

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        data
      );
      imageUrls.push(res.data.secure_url);
    }

    const updated = { ...formData, imageUrls };

    const res = await axios.put(`http://localhost:5001/api/listings/${id}`, updated, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setListing(res.data.listing);
    setEditing(false);
    setSelectedImages([]);
    window.location.reload();
  };

  const handleSetMainImage = async (index) => {
    if (!token) {
      console.warn('No token found — user may not be logged in');
      alert('You must be logged in to perform this action.');
      return;
    }

    try {
      await axios.put(
        `http://localhost:5001/api/listings/${id}/main-image`,
        { index },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const res = await axios.get(`http://localhost:5001/api/listings/${id}`);
      setListing(res.data);
    } catch (err) {
      console.error('Failed to set main image:', err);
      if (err.response?.status === 401) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  };

  const handleImageClick = (url) => {
    setModalImageUrl(url);
    setShowModal(true);
  };

  if (!listing) return <p>Loading...</p>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', position: 'relative' }}>
      <div style={{ marginTop: '20vh' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            backgroundColor: '#ccc',
            color: 'black',
            padding: '6px 10px',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>

        <h2>{listing.title}</h2>
        <p><strong>Price:</strong> ${listing.price}</p>
        <p>{listing.description}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
          {listing.images?.map((url, index) => (
            <div key={index} style={{ position: 'relative', textAlign: 'center' }}>
              <img
                src={url}
                alt={`Image ${index}`}
                onClick={() => handleImageClick(url)}
                style={{
                  width: 150,
                  height: 150,
                  objectFit: 'cover',
                  cursor: 'pointer',
                  border: index === listing.mainImageIndex ? '3px solid green' : '1px solid #ccc',
                }}
              />
              {isLoggedIn && (editing ? (
                <button
                  onClick={() => handleDeleteImage(index)}
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    backgroundColor: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    padding: '2px 6px',
                    cursor: 'pointer',
                  }}
                >
                  Delete Image
                </button>
              ) : (
                index !== listing.mainImageIndex && (
                  <button
                    onClick={() => handleSetMainImage(index)}
                    style={{
                      marginTop: 6,
                      backgroundColor: '#ff6b4a',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Set as Main Image
                  </button>
                )
              ))}
            </div>
          ))}
        </div>

        {isLoggedIn && editing && (
          <div style={{ marginTop: 24 }}>
            <label>Title:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%', marginBottom: 8 }}
            />
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ width: '100%', height: 100, marginBottom: 8 }}
            />
            <label>Price:</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              style={{ width: '100%', marginBottom: 8 }}
            />

            <label>Upload New Images:</label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              style={{ display: 'block', marginBottom: 12 }}
            />

            <button
              onClick={handleSave}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '10px 16px',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              Save
            </button>
          </div>
        )}

        {isLoggedIn && !editing && (
          <button
            onClick={() => setEditing(true)}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              backgroundColor: 'green',
              color: 'white',
              padding: '6px 10px',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        )}

        {isLoggedIn && (
          <button
            onClick={handleDeleteListing}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              backgroundColor: 'red',
              color: 'white',
              padding: '10px 16px',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Delete Listing
          </button>
        )}

        {showModal && (
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              cursor: 'zoom-out',
            }}
          >
            <img
              src={modalImageUrl}
              alt="Preview"
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                borderRadius: 8,
                boxShadow: '0 0 20px black',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingDetailsPage;
