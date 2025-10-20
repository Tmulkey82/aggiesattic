import React, { useState } from 'react';
import Modal from './Modal';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

export default function AddListingModal({ isOpen, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const token = localStorage.getItem('token') || '';

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      // 1) Upload images
      const fd = new FormData();
      for (const f of imageFiles) fd.append('images', f);
      const upRes = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!upRes.ok) throw new Error('Upload failed');
      const { imageUrls } = await upRes.json();

      // 2) Create listing
      const createRes = await fetch(`${API_BASE}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          price: price === '' ? null : Number(price),
          images: imageUrls,
          imgUrl: imageUrls?.[0] || '',
        }),
      });
      if (!createRes.ok) throw new Error('Create listing failed');
      const data = await createRes.json();

      // 3) Notify parent + reset
      onAdd(data.listing || data);
      setTitle('');
      setDescription('');
      setPrice('');
      setImageFiles([]);
      onClose();
    } catch (err) {
      console.error(err);
      alert('There was a problem adding the listing. Check console for details.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md max-w-lg w-full">
        <h2 className="text-xl font-bold mb-4">Create New Listing</h2>

        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded mb-3"
          required
        />

        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded mb-3"
          rows={4}
          required
        />

        <label className="block text-sm font-medium mb-1">Price (optional)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border p-2 rounded mb-3"
        />

        <label className="block text-sm font-medium mb-1">Images</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
          className="w-full border p-2 rounded mb-4"
          required
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded"
            disabled={busy}
          >
            {busy ? 'Saving…' : 'Add Listing'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
