import express from "express";
import mongoose from "mongoose";
import Event from "../models/Event.js";
import authMiddleware from "../middleware/authMiddleware.js";
import multer from "multer";
import fs from "fs";
import { uploadImageWithMeta, deleteImage } from "../services/cloudinaryService.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * PUBLIC: GET all ACTIVE events
 *
 * Rules:
 *  - Include events with no date AND no endDate (evergreen)
 *  - Include events with endDate in the future
 *  - Include events with date in the future (24h grace window)
 *
 * Sort:
 *  - Dated events first (soonest first)
 *  - Undated events last (newest first)
 */
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const graceStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const filter = {
      $or: [
        // Evergreen events
        { date: null, endDate: null },

        // Explicit endDate still active
        { endDate: { $gte: now } },

        // No endDate, use date with grace window
        { endDate: null, date: { $gte: graceStart } },
      ],
    };

    const events = await Event.find(filter).sort({
      date: 1,
      createdAt: -1,
    });

    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Error fetching events", error: err.message });
  }
});

/** PUBLIC: GET single event */
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json(event);
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ message: "Error fetching event", error: err.message });
  }
});

/** ADMIN: Create event */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, date, endDate } = req.body;

    const event = new Event({
      title,
      description,
      date: date ? new Date(date) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.user?.id || req.user?._id,
    });

    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(400).json({ message: err.message || "Error creating event" });
  }
});

/** ADMIN: Update event */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const { title, description, date, endDate } = req.body;

    const updated = await Event.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        date: date ? new Date(date) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Event not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating event:", err);
    res.status(400).json({ message: err.message || "Error updating event" });
  }
});

/** ADMIN: Upload images to an event */
router.post("/:id/images", authMiddleware, upload.array("images"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const uploaded = [];

    for (const file of req.files || []) {
      const meta = await uploadImageWithMeta(file.path);
      fs.unlinkSync(file.path);

      const imageObj = {
        url: meta.url,
        publicId: meta.publicId,
        uploadedAt: new Date(),
        uploadedBy: req.user?.id || req.user?._id,
      };

      event.images.push(imageObj);
      uploaded.push(imageObj);
    }

    await event.save();
    res.status(201).json({ images: event.images, uploaded });
  } catch (err) {
    console.error("Error uploading event images:", err);
    res.status(500).json({ message: "Image upload failed", error: err.message });
  }
});

/** ADMIN: Delete a single image from an event */
router.delete("/:id/images/:imageId", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const image = event.images.id(req.params.imageId);
    if (!image) return res.status(404).json({ message: "Image not found" });

    // Best-effort delete from Cloudinary
    try {
      await deleteImage(image.publicId);
    } catch (cloudErr) {
      console.warn("Cloudinary delete failed (continuing):", cloudErr.message);
    }

    image.deleteOne();
    await event.save();

    res.json({ images: event.images });
  } catch (err) {
    console.error("Error deleting event image:", err);
    res.status(500).json({ message: "Image delete failed", error: err.message });
  }
});

/** ADMIN: Delete event (with Cloudinary cleanup) */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Best-effort delete associated Cloudinary images
    const publicIds = (event.images || [])
      .map((img) => img?.publicId)
      .filter(Boolean);

    for (const pid of publicIds) {
      try {
        await deleteImage(pid);
      } catch (cloudErr) {
        console.warn(`Cloudinary delete failed for ${pid} (continuing):`, cloudErr.message);
      }
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ message: "Error deleting event", error: err.message });
  }
});

export default router;
