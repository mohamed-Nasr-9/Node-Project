import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["verify", "reset","restore"],
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      required: true, 
      default: false,
    },
  },
  {
    timestamps: false, 
    versionKey: false, 
    _id: true, 
  }
);

export default mongoose.model("Token", tokenSchema);