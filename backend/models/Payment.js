import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
  {
    at:     { type: Date, default: Date.now },
    status: { type: String },       // succeeded | failed | requires_action | ...
    reason: { type: String }        // optional error message
  },
  { _id: false }
);

const refundSchema = new mongoose.Schema(
  {
    at:       { type: Date, default: Date.now },
    amount:   { type: Number, required: true },
    reason:   { type: String },
    refundId: { type: String }
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    orderId:  { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    provider: { type: String, enum: ["stripe"], required: true },
    intentId: { type: String, index: true , required: true },   // stripe payment_intent id
    chargeId: { type: String },                // stripe charge id
    status:   { type: String, enum: ["requires_action","processing","succeeded","failed","refunded"], required: true },
    amount:   { type: Number, required: true },   
    currency: { type: String, default: "USD" },

    attempts: [attemptSchema],
    refunds:  [refundSchema],

    // metadata: { type: Object }
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }

  },
  { timestamps: true }
);

paymentSchema.index({ provider: 1, intentId: 1 }, { unique: true, sparse: true });

export default mongoose.model("Payment", paymentSchema);
