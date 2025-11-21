import mongoose from "mongoose";
import { stripe } from "../config/stripe.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import ProcessedStripeEvent from "../models/ProcessedStripeEvent.js";
import { finalizeReservationAndDeduct } from "../utils/reservationFinalize.js";
import { releaseReservationBySessionId } from "../utils/reservationRelease.js";
import { sendOrderEmail } from "../services/orderEmails.js";
import dotenv from "dotenv";


dotenv.config();

//  Idempotency check
async function ensureEventOnce(eventId) {
  try {
    await ProcessedStripeEvent.create({ eventId });
    return true;
  } catch {
    return false;
  }
}

export default async function paymentWebhook(req, res) {
  const sig = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body, 
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("✅ Stripe event received:", event.type);

    
    const firstTime = await ensureEventOnce(event.id);
    if (!firstTime) {
      console.log("⚠️ Duplicate event ignored:", event.id);
      return res.json({ received: true, deduped: true });
    }

    // ═══════════════════════════════════════════════════════════
    //  CHECKOUT SESSION COMPLETED 
    // ═══════════════════════════════════════════════════════════
    if (event.type === "checkout.session.completed") {
      const sessionObj = event.data.object;
      const orderId = sessionObj.metadata?.orderId;
      const realIntentId = sessionObj.payment_intent;
      const tempIntentId = `session_${sessionObj.id}`;

      console.log("💳 Session completed:", sessionObj.id);
      console.log("📦 Order ID:", orderId);
      console.log("💰 Payment Intent:", realIntentId);

      if (orderId && realIntentId) {
        const mongoSession = await mongoose.startSession();
        
        try {
          await mongoSession.withTransaction(async () => {
            //  Update Payment
            await Payment.findOneAndUpdate(
              { provider: "stripe", intentId: tempIntentId },
              {
                intentId: realIntentId,
                status: "succeeded",
                $push: { 
                  attempts: { 
                    status: "succeeded", 
                    timestamp: new Date() 
                  } 
                },
                metadata: {
                  sessionId: sessionObj.id,
                  latestStatus: "succeeded",
                  completedAt: new Date()
                }
              },
              { new: true, session: mongoSession }
            );
            console.log("✅ Payment updated to SUCCEEDED");

            //  Finalize stock reservation & deduct
            await finalizeReservationAndDeduct(orderId);
            console.log("✅ Stock deducted");

            //  Update Order
            const order = await Order.findById(orderId).session(mongoSession);
            if (order && order.status === "pending") {
              order.status = "paid";
              order.payment = {
                ...(order.payment || {}),
                method: "card",
                status: "paid",
                txId: realIntentId,
                paidAt: new Date()
              };
              await order.save({ session: mongoSession });
              console.log("✅ Order updated to PAID");
            }
          });

          //  Send success email 
          setImmediate(() => {
            sendOrderEmail(orderId, "paid")
              .then(() => console.log("📧 Success email sent"))
              .catch((e) => console.warn("⚠️ Email failed:", e?.message));
          });

        } catch (e) {
          await releaseReservationBySessionId(sessionObj.id);
          console.error("❌ Error completing checkout:", e);
          throw e;
        } finally {
          mongoSession.endSession();
        }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // CHECKOUT SESSION EXPIRED 
    // ═══════════════════════════════════════════════════════════
    if (event.type === "checkout.session.expired") {
      const sessionObj = event.data.object;
      const orderId = sessionObj.metadata?.orderId;

      console.log("⏱️ Session expired:", sessionObj.id);

    
      await releaseReservationBySessionId(sessionObj.id);

      // Update Order status
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          status: "cancelled",
          "payment.status": "cancelled"
        });
        
        // Send cancellation email
        setImmediate(() => {
          sendOrderEmail(orderId, "cancelled")
            .then(() => console.log("📧 Cancellation email sent"))
            .catch((e) => console.warn("⚠️ Email failed:", e?.message));
        });
      }
    }

    // ═══════════════════════════════════════════════════════════
    // ASYNC PAYMENT FAILED
    // ═══════════════════════════════════════════════════════════
    if (event.type === "checkout.session.async_payment_failed") {
      const sessionObj = event.data.object;
      const orderId = sessionObj.metadata?.orderId;

      console.log("❌ Async payment failed:", sessionObj.id);

      await releaseReservationBySessionId(sessionObj.id);

      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          status: "cancelled",
          "payment.status": "failed"
        });

        setImmediate(() => {
          sendOrderEmail(orderId, "failed")
            .then(() => console.log("📧 Failed email sent"))
            .catch((e) => console.warn("⚠️ Email failed:", e?.message));
        });
      }
    }

    // ═══════════════════════════════════════════════════════════
    // PAYMENT INTENT FAILED
    // ═══════════════════════════════════════════════════════════
    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object;
      const orderId = pi.metadata?.orderId;

      console.log("❌ PaymentIntent failed:", pi.id);

      // Update Payment
      await Payment.findOneAndUpdate(
        { provider: "stripe", intentId: pi.id },
        {
          status: "failed",
          $push: { 
            attempts: { 
              status: "failed", 
              timestamp: new Date() 
            } 
          },
          metadata: {
            latestStatus: "failed",
            failureReason: pi.last_payment_error?.message
          }
        }
      );

      // Send failure email
      if (orderId) {
        setImmediate(() => {
          sendOrderEmail(orderId, "failed") 
            .then(() => console.log("📧 Failed email sent"))
            .catch((e) => console.warn("⚠️ Email failed:", e?.message));
        });
      }
    }

    return res.json({ received: true });
    
  } catch (err) {
    console.error("❌ Webhook error:", err?.message || err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}


