import mongoose from "mongoose";
import validator from "validator";
import Address from "./userAddress.js";

const userSchema = new mongoose.Schema(
  {
    FirstName: {
      type: String,
      required: [true, "First Name is required"],
      minlength: [2, "First Name must be at least 2 characters"],
      maxlength: [50, "First Name cannot exceed 50 characters"],
      trim: true,
    },

    LastName: {
      type: String,
      required: [true, "Last Name is required"],
      minlength: [2, "Last Name must be at least 2 characters"],
      maxlength: [50, "Last Name cannot exceed 50 characters"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      unique: true,
      validate: {
        validator: validator.isEmail,
        message: "Invalid email format",
      },
    },

    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },

    role: {
      type: String,
      enum: ["admin", "user", "author"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: { 
      type: Boolean, 
      default: false 
    },
    deletedAt: { 
      type: Date, 
      default: null 
    },
    addresses: [Address],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

