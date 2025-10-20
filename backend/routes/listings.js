import express from 'express';
import Listing from '../models/Listing.js';
import { deleteImage } from '../services/cloudinaryService.js';
import authMiddleware from '../middleware/authMiddleware.js'; // ✅ import auth middleware
import { postPhotoByUrl, postText } from '../services/facebookService.js';

const router = express.Router();

// GET all listings (no auth)
router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find().sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    console.error('Error fetching listings:', err);
    res.status(500).json({ message: 'Error fetching listings', error: err.message });
  }
});

// GET a single listing by ID (no auth)
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    console.error('Error fetching listing:', err);
    res.status(500).json({ message: 'Error fetching listing', error: err.message });
  }
});

// POST a new listing (requires auth)
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, price, imageUrls } = req.body;

  if (!title || !description || !price || !imageUrls) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const listing = new Listing({
      title,
      description,
      price,
      imgUrl: imageUrls[0],
      images: imageUrls,
      postedToFacebook: false,
      facebookPostId: null,
      createdBy: null,
    });

    await listing.save();

    // --- Facebook autopost (non-blocking) ---
    (async () => {
      try {
        const capTitle = listing.title || 'New listing';
        const capPrice = (typeof listing.price !== 'undefined' && listing.price !== null) ? `$${listing.price}` : '';
        const caption = capPrice ? `${capTitle} — ${capPrice}` : capTitle;

        const imageUrl = listing.imgUrl || (Array.isArray(listing.images) ? listing.images[0] : null);

        if (imageUrl) {
          const fbRes = await postPhotoByUrl(imageUrl, caption);
          if (fbRes?.post_id || fbRes?.id) {
            listing.postedToFacebook = true;
            listing.facebookPostId = fbRes.post_id || fbRes.id;
            try { await listing.save(); } catch {}
          }
        } else {
          const fbRes = await postText(caption);
          if (fbRes?.id) {
            listing.postedToFacebook = true;
            listing.facebookPostId = fbRes.id;
            try { await listing.save(); } catch {}
          }
        }
      } catch (fbErr) {
        console.warn('Facebook post skipped:', fbErr?.response?.data || fbErr.message);
      }
    })();
    // --- end Facebook autopost ---

    res.status(201).json({ message: 'Listing created', listing });
  } catch (err) {
    console.error('Error creating listing:', err);
    res.status(500).json({ message: 'Error creating listing', error: err.message });
  }
});

// PUT: update main image index (requires auth)
router.put('/:id/main-image', authMiddleware, async (req, res) => {
  try {
    const listingId = req.params.id;
    const { index } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    listing.mainImageIndex = index;
    await listing.save();

    res.json({ message: 'Main image updated successfully' });
  } catch (err) {
    console.error('Error updating main image:', err);
    res.status(500).json({ message: 'Error updating main image', error: err.message });
  }
});

// PUT: edit listing (requires auth)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, price, imageUrls } = req.body;
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    listing.title = title || listing.title;
    listing.description = description || listing.description;
    listing.price = price || listing.price;
    listing.images = imageUrls || listing.images;
    listing.imgUrl = imageUrls?.[0] || listing.imgUrl;

    await listing.save();
    res.json({ message: 'Listing updated', listing });
  } catch (err) {
    console.error('Error updating listing:', err);
    res.status(500).json({ message: 'Error updating listing', error: err.message });
  }
});

// DELETE listing and its Cloudinary images (requires auth)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.images && listing.images.length > 0) {
      for (const url of listing.images) {
        try {
          const publicId = url.split('/').pop().split('.')[0];
          await deleteImage(publicId);
        } catch (err) {
          console.warn(`Failed to delete image ${url}:`, err.message);
        }
      }
    }

    await listing.deleteOne();
    res.json({ message: 'Listing and associated images deleted' });
  } catch (err) {
    console.error('Error deleting listing:', err);
    res.status(500).json({ message: 'Error deleting listing', error: err.message });
  }
});

// DELETE a specific image from a listing (requires auth)
router.delete('/:id/image/:index', authMiddleware, async (req, res) => {
  const { id, index } = req.params;

  try {
    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const imageIndex = parseInt(index, 10);
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= listing.images.length) {
      return res.status(400).json({ message: 'Invalid image index' });
    }

    const imageUrl = listing.images[imageIndex];
    const publicId = imageUrl.split('/').pop().split('.')[0];

    try {
      await deleteImage(publicId);
    } catch (cloudErr) {
      console.warn(`Failed to delete from Cloudinary: ${cloudErr.message}`);
    }

    listing.images.splice(imageIndex, 1);
    if (listing.mainImageIndex === imageIndex) {
      listing.mainImageIndex = 0;
    } else if (listing.mainImageIndex > imageIndex) {
      listing.mainImageIndex -= 1;
    }

    listing.imgUrl = listing.images[listing.mainImageIndex] || '';
    await listing.save();

    res.json({ message: 'Image deleted successfully', listing });
  } catch (err) {
    console.error('Error deleting image from listing:', err);
    res.status(500).json({ message: 'Error deleting image', error: err.message });
  }
});

export default router;
