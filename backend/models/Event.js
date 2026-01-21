import mongoose from "mongoose";

const eventImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }, // optional audit
    publicId: { type: String, required: true },
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    // Optional dates
    date: { type: Date, default: null },
    endDate: { type: Date, default: null },

    // Optional images
    images: { type: [eventImageSchema], default: [] },

    // Facebook sync (best-effort). We store the Page post id so we can update/delete it later.
    facebook: {
      postId: { type: String, default: null },
      lastSyncedAt: { type: Date, default: null },
      lastError: { type: String, default: null },
    },

    // Not displayed on the frontend
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true } // creates createdAt, updatedAt
);

// Optional but recommended: enforce endDate >= date when both exist
eventSchema.pre("validate", function (next) {
  if (this.date && this.endDate && this.endDate < this.date) {
    return next(new Error("endDate must be greater than or equal to date"));
  }
  next();
});

export default mongoose.model("Event", eventSchema);
