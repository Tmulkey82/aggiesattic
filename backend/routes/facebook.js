// backend/routes/facebook.js
import express from "express";
import auth from "../middleware/authMiddleware.js"; // protect if you want
import { postToFeed, postPhotoByUrl, getRecentPosts } from "../services/facebookService.js";

const router = express.Router();

// POST /api/facebook/test-text  { message }
router.post("/test-text", /*auth,*/ async (req, res) => {
  try {
    const { message = "Hello from Aggie’s Attic 👋" } = req.body || {};
    const data = await postToFeed({ message });
    res.json({ ok: true, data });
  } catch (err) {
    const error = err.response?.data || err.message;
    res.status(400).json({ ok: false, error });
  }
});

// POST /api/facebook/test-photo  { imageUrl, caption }
router.post("/test-photo", /*auth,*/ async (req, res) => {
  try {
    const { imageUrl, caption = "" } = req.body || {};
    if (!imageUrl) return res.status(400).json({ ok: false, error: "imageUrl required" });
    const data = await postPhotoByUrl({ imageUrl, caption });
    res.json({ ok: true, data });
  } catch (err) {
    const error = err.response?.data || err.message;
    res.status(400).json({ ok: false, error });
  }
});

// GET /api/facebook/recent?limit=5
router.get("/recent", /*auth,*/ async (req, res) => {
  try {
    const limit = Number(req.query.limit || 5);
    const data = await getRecentPosts(limit);
    res.json({ ok: true, data });
  } catch (err) {
    const error = err.response?.data || err.message;
    res.status(400).json({ ok: false, error });
  }
});

export default router;
