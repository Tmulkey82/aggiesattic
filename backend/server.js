// server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import eventRoutes from "./routes/events.js";
import authRoutes from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";
import uploadRoutes from "./routes/upload.js";
import facebookRoutes from "./routes/facebook.js";

dotenv.config();

const app = express();

// --- Core middleware ---
app.use(express.json());

// --- CORS ---
// In production, restrict to your Vercel domain via CORS_ORIGIN.
// If CORS_ORIGIN is not set, fall back to allowing all origins (useful for local/dev).
const allowedOrigin = process.env.CORS_ORIGIN;

app.use(
  cors({
    origin: allowedOrigin || "*",
    credentials: false,
  })
);

// --- Health check (Fly + quick debugging) ---
app.get("/health", (req, res) => res.status(200).send("ok"));

// --- Routes ---
app.use("/upload-image", uploadRoutes);
app.use("/api/facebook", facebookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/events", eventRoutes);

// --- Startup / DB ---
const PORT = Number(process.env.PORT) || 8080;
const HOST = "0.0.0.0";

if (!process.env.MONGO_URI) {
  console.error("FATAL: MONGO_URI is not set.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, HOST, () => {
      console.log(`Server running on ${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
