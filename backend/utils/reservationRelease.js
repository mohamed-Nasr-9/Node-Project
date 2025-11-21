import mongoose from "mongoose";
import Book from "../models/Book.js";
import Reservation from "../models/Reservation.js";

export async function releaseReservationBySessionId(sessionId) {
  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    const r = await Reservation.findOne({ sessionId }).session(session);
    if (!r) return;
    if (r.items?.length) {
      const ops = r.items.map(it => ({
        updateOne: {
          filter: { _id: it.bookId, reserved: { $gte: it.qty } },
          update: { $inc: { reserved: -it.qty } }
        }
      }));
      await Book.bulkWrite(ops, { session });
    }
    await Reservation.deleteOne({ _id: r._id }, { session });
  });
  session.endSession();
}