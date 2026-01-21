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

// ---- CORS (single origin response, supports www + non-www) ----
const allowedOrigins = new Set([
  "https://aggiesattic.org",
  "https://www.aggiesattic.org",
  "http://localhost:5173",
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Non-browser clients (curl, server-to-server) may send no Origin header
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use("/upload-image", uploadRoutes);
app.use("/api/facebook", facebookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/events", eventRoutes);

// ---- Mongo + server ----
const port = Number(process.env.PORT) || 8080;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => console.error(err));
