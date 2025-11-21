import mongoose from "mongoose";
import Book from "../models/Book.js";
import Reservation from "../models/Reservation.js";
import Order from "../models/Order.js";

export async function finalizeReservationAndDeduct(orderId) {
  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    const r = await Reservation.findOne({ orderId }, null, { session });
    if (r) {
      if (r.items?.length) {
        const unreserveOps = r.items.map(it => ({
          updateOne: {
            filter: { _id: it.bookId, reserved: { $gte: it.qty } },
            update: { $inc: { reserved: -it.qty } }
          }
        }));
        await Book.bulkWrite(unreserveOps, { session });
      }
      await Reservation.deleteOne({ _id: r._id }, { session });
    }

    const order = await Order.findById(orderId).session(session);
    const deductOps = order.items.map(it => ({
      updateOne: {
        filter: { _id: it.bookId, stock: { $gte: it.qty } },
        update: { $inc: { stock: -it.qty } }
      }
    }));
    const res = await Book.bulkWrite(deductOps, { session });
    if (res.result?.nMatched !== order.items.length) {
      throw new Error("Final stock deduction failed");
    }
  });
  session.endSession();
}