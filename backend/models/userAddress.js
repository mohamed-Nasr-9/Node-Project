import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  label: { type: String },
  fullName: { type: String },
  phone: { type: String },
  line1: { type: String },
  line2: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  postalCode: { type: String },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

export default addressSchema;