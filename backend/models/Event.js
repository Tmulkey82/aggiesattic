import mongoose from "mongoose";

function normalizeDateOnlyToUtcNoon(value) {
  if (!value) return null;

  // If already a Date, keep as-is
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // If it's a string like "YYYY-MM-DD", normalize to 12:00 UTC
  if (typeof value === "string") {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
    }

    // Fall back: try parsing other string formats
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // If it's a number (timestamp) or other, let Date try
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

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

    // Optional dates (date-only behavior; stored as UTC noon to avoid TZ day-shift)
    date: { type: Date, default: null, set: normalizeDateOnlyToUtcNoon },
    endDate: { type: Date, default: null, set: normalizeDateOnlyToUtcNoon },

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
