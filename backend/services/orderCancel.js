
// services/orderCancel.js
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Book from "../models/Book.js";
import { stripe } from "../config/stripe.js";
import { releaseReservationBySessionId } from "../utils/reservationRelease.js";
import { sendOrderEmail } from "./orderEmails.js";
import { normalizeStripeReason } from '../helpers/stripeReason.js';


export async function cancelPendingOrder({ orderId, actor = "user", reason = "" }) {
  const session = await mongoose.startSession();
  let orderDoc;
  try {
    await session.withTransaction(async () => {
      orderDoc = await Order.findById(orderId).session(session);
      if (!orderDoc) throw new Error("Order not found");
      if (orderDoc.status !== "pending") {
        throw new Error(`Cannot cancel order in status: ${orderDoc.status}`);
      }


      const sessionId = orderDoc.payment?.sessionId;
      if (sessionId) {
        await releaseReservationBySessionId(sessionId);
      }

    
      orderDoc.status = "cancelled";
      if (orderDoc.payment) {
        orderDoc.payment.status = "cancelled";
      }


      // orderDoc.cancelledAt = new Date();
      // orderDoc.cancelReason = reason || undefined;
      // orderDoc.cancelledBy = { id: null, role: actor }; 

      await orderDoc.save({ session });

   
        await Payment.updateMany(
            { orderId: orderDoc._id, provider: "stripe", status: "pending" },
            { $set: { status: "cancelled" } },
            { session }
        );
    });


    try { await sendOrderEmail(orderDoc._id, "cancelled"); } catch {}

    return { ok: true, order: orderDoc };
  } finally {
    session.endSession();
  }
}



//   Refund a PAID order:
export async function refundPaidOrder({
  orderId,
  actor = 'admin',
  reason = 'requested_by_customer', 
  restock = true
}) {
  const session = await mongoose.startSession();
  let orderDoc;

  try {
    await session.withTransaction(async () => {
      orderDoc = await Order.findById(orderId).session(session);
      if (!orderDoc) throw new Error('Order not found');

      if (orderDoc.status === 'refunded' || orderDoc.payment?.status === 'refunded') {
        return;
      }

      if (orderDoc.status !== 'paid') {
        throw new Error(`Only paid orders can be refunded. Current status: ${orderDoc.status}`);
      }

      const method = orderDoc.payment?.method;
      const txId   = orderDoc.payment?.txId; 
      if (!txId || method === 'cash') {
        throw new Error('This order cannot be refunded automatically (no online payment txId).');
      }

      let alreadyFullyRefunded = false;
      let stripeRefundId = null;

      try {
        const pi = await stripe.paymentIntents.retrieve(txId, { expand: ['latest_charge', 'latest_charge.refunds'] });
        const lc = typeof pi.latest_charge === 'object' ? pi.latest_charge : null;
        if (lc?.refunded === true || (lc?.amount_captured && lc?.amount_refunded >= lc.amount_captured)) {
          alreadyFullyRefunded = true;
          stripeRefundId = lc?.refunds?.data?.[0]?.id || null;
        }
      } catch (e) {
        console.warn('⚠️ PI pre-check failed:', e.message);
      }

      if (!alreadyFullyRefunded) {
        const idemKey = `refund:${orderId}:${txId}:full`;
        const stripeReason = normalizeStripeReason(reason);

        try {
          const r = await stripe.refunds.create(
            {
              payment_intent: txId,
              reason: stripeReason,
              metadata: {
                human_reason: reason || 'Cancelled by admin',
                actor: actor || 'admin',
                order_id: String(orderId),
              }
            },
            { idempotencyKey: idemKey }
          );
          stripeRefundId = r.id;
        } catch (e) {
          if (e?.code === 'charge_already_refunded') {
            stripeRefundId = stripeRefundId || `already_${txId}`;
          } else {
            throw e;
          }
        }
      }

      if (restock && Array.isArray(orderDoc.items)) {
        const ops = orderDoc.items.map(it => ({
          updateOne: {
            filter: { _id: it.bookId },
            update: { $inc: { stock: it.qty } }
          }
        }));
        if (ops.length) await Book.bulkWrite(ops, { session });
      }

      orderDoc.status = 'refunded';
      if (orderDoc.payment) {
        orderDoc.payment.status = 'refunded';
        orderDoc.payment.refundId = stripeRefundId || undefined;
        orderDoc.payment.refundedAt = new Date();
      }

      
      orderDoc.cancelReason = reason || 'Cancelled by admin';

      await orderDoc.save({ session });

      await Payment.updateMany(
        { orderId: orderDoc._id, provider: 'stripe', intentId: txId },
        { $set: { status: 'refunded' } },
        { session }
      );
    });

    
    try { await sendOrderEmail(orderDoc._id, 'refunded'); } catch {}

    return { ok: true, order: orderDoc };
  } finally {
    session.endSession();
  }
}