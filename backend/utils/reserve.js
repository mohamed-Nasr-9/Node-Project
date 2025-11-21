import mongoose from "mongoose";
import Book from "../models/Book.js";
import Reservation from "../models/Reservation.js";

export async function reserveStockForOrder(order, sessionId) {
  const session = await mongoose.startSession();
  await session.withTransaction(async () => {
    for (const it of order.items) {
      const res = await Book.updateOne(
        {
          _id: it.bookId,
          $expr: { $gte: [ { $subtract: ["$stock", "$reserved"] }, it.qty ] }
        },
        { $inc: { reserved: it.qty } },
        { session }
      );
      if (res.matchedCount !== 1) {
        throw new Error("Insufficient available stock to reserve");
      }
    }
    await Reservation.create([{
      orderId: order._id,
      items: order.items.map(i => ({ bookId: i.bookId, qty: i.qty })),
      sessionId,
      expiresAt: new Date(Date.now() + 30*60*1000)
    }], { session });
  });
  session.endSession();
}