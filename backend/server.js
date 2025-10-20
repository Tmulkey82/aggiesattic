import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import listingRoutes from './routes/listings.js';
import uploadRoutes from './routes/upload.js';
import facebookRoutes from "./routes/facebook.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use('/upload-image',uploadRoutes);
app.use("/api/facebook", facebookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error(err));
