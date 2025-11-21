import mongoose from "mongoose";
const { Schema } = mongoose;

const ReservationSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, index: true, required: true },
  items: [{ bookId: { type: Schema.Types.ObjectId, ref: "Book" }, qty: Number }],
  sessionId: { type: String, index: true, required: true }, 
  expiresAt: { type: Date, index: { expires: '30m' } } 
}, { timestamps: true });

export default mongoose.model("Reservation", ReservationSchema);