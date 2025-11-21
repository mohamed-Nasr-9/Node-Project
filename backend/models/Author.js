// models/Author.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const AuthorSchema = new Schema(
  {
    // The account that applied to become an author
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      immutable: true
    },

    // Public facing author profile
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 2000
    },

    // Workflow state
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "revoked"],

      default: "pending",
      index: true
    },
    appliedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    reason: { type: String, trim: true, maxlength: 1000 }
  },
  {
    timestamps: true,          // adds createdAt, updatedAt
    versionKey: false,         // no __v
    collection: "authors",     // keep collection name stable
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // normalize id field
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    }
  }
);

// Ensure one author application per user
AuthorSchema.index({ userId: 1 }, { unique: true });

// Small guards for transitions (optional but nice to have)
AuthorSchema.pre("findOneAndUpdate", function(next) {
  const update = this.getUpdate() || {};
  if (update.status === "approved") {
    update.approvedAt = new Date();
    update.rejectedAt = undefined;
    update.reason = undefined;
    this.setUpdate(update);
  }
  if (update.status === "rejected") {
    update.rejectedAt = new Date();
    update.approvedAt = undefined;
    this.setUpdate(update);
  }
  next();
});

// Convenience helpers
AuthorSchema.statics.findApprovedByUser = function(userId) {
  return this.findOne({ userId, status: "approved" });
};

const Author = mongoose.model("Author", AuthorSchema);
export default Author;
