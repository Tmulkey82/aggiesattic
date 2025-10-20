import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { uploadImage } from '../services/cloudinaryService.js';
import authMiddleware from '../middleware/authMiddleware.js'; // ✅ uncommented

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Protected: upload images (requires login)
router.post('/', authMiddleware, upload.array('images'), async (req, res) => {
  try {
    const imageUrls = [];

    for (const file of req.files) {
      const imageUrl = await uploadImage(file.path);
      imageUrls.push(imageUrl);
      fs.unlinkSync(file.path); // delete temp file
    }

    res.json({ imageUrls });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Image upload failed' });
  }
});

export default router;
