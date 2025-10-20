import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number },
  images: [{ type: String }],
  mainImageIndex: { type: Number, default: 0 },
  postedToFacebook: { type: Boolean, default: false },
  facebookPostId: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

export default mongoose.model('Listing', listingSchema);
