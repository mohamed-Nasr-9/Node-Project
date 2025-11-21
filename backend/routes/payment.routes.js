import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import verifyJWT from "../middleware/verifyJWT.js";
import { stripe } from "../config/stripe.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";

dotenv.config();
const router = express.Router();
const CURRENCY = (process.env.STRIPE_CURRENCY || "EGP").toLowerCase();

/**
 * A) to frontend in the future    ==?>>    client secret
 * POST /api/payments/create-intent/:orderId
 */
// router.post("/create-intent/:orderId", verifyJWT, async (req, res) => { 
//   try {
//     const { orderId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(orderId)) {
//       return res.status(400).json({ message: "Invalid orderId" });
//     }

//     const order = await Order.findById(orderId);
//     if (!order) return res.status(404).json({ message: "Order not found" });

//     if (order.currency && order.currency !== CURRENCY.toUpperCase()) {
//       return res.status(400).json({ message: `Currency mismatch: order=${order.currency}, stripe=${CURRENCY.toUpperCase()}` });
//     }

//     const me = String(req.user._id || req.user.id);
//     if (String(order.userId) !== me) return res.status(403).json({ message: "Forbidden" });
//     if (order.status !== "pending") return res.status(400).json({ message: `Order is ${order.status}` });

//     const amountInMinor = Math.round(Number(order.amounts.grandTotal) * 100);

//     const pi = await stripe.paymentIntents.create({
//      amount: amountInMinor,
//      currency: CURRENCY,
//      payment_method_types: ["card"],
//     //  payment_method: "pm_card_visa", 
//      confirm: true,                  
//      metadata: { orderId: String(order._id), userId: me },
//      });
  

//     // paymentIntent created successfully
//     await Payment.findOneAndUpdate(
//       { provider: "stripe", intentId: pi.id },
//       {
//         orderId: order._id,
//         userId: order.userId,
//         provider: "stripe",
//         intentId: pi.id,
//         status: pi.status || "requires_action",
//         amount: Number(order.amounts.grandTotal),
//         currency: CURRENCY.toUpperCase(),
//         $push: { attempts: { status: pi.status || "requires_action" } },
//         metadata: { latestStatus: pi.status }
//       },
//       { upsert: true, new: true }
//     );

//     //order update with payment info
//     order.payment = {
//       ...(order.payment || {}),
//       method: "card",
//       status: "unpaid",
//       txId: pi.id,
//       amount: Number(order.amounts.grandTotal),
//       currency: CURRENCY.toUpperCase()
//     };
//     await order.save();
    
//     res.json({
//     clientSecret: pi.client_secret,
//     paymentIntentId: pi.id,
//     dashboardUrl: `https://dashboard.stripe.com/test/payments/${pi.id}`
//     });
//   } catch (err) {
//     console.error("create-intent error:", err?.raw || err);
//     res.status(500).json({ message: "Failed to create intent" });
//   }
// });

router.post("/create-checkout/:orderId", verifyJWT, async (req, res) => { 
  try {
    const { orderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid orderId" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const me = String(req.user._id || req.user.id);
    if (String(order.userId) !== me) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: `Order is ${order.status}` });
    }

    if (order.currency && order.currency !== CURRENCY.toUpperCase()) {
      return res.status(400).json({ 
        message: `Currency mismatch: order=${order.currency}, stripe=${CURRENCY.toUpperCase()}` 
      });
    }

    const amountInMinor = Math.round(Number(order.amounts.grandTotal) * 100);

    //  Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product_data: {
              name: `Order #${order._id}`,
              description: `Payment for order ${order._id}`,
            },
            unit_amount: amountInMinor,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL || "http://localhost:4200"}/cart/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:4200"}/cart/payment/failed`,
      metadata: {
        orderId: String(order._id),
        userId: me,
      },
      customer_email: req.user.email || "test@example.com",
    });

    console.log("✅ Checkout Session created:", session.id);
    console.log("💰 Payment Intent:", session.payment_intent); 

    //  استخدم sessionId كـ intentId مؤقت
    const tempIntentId = `session_${session.id}`;

    await Payment.findOneAndUpdate(
      { provider: "stripe", intentId: tempIntentId },
      {
        orderId: order._id,
        userId: order.userId,
        provider: "stripe",
        intentId: tempIntentId,
        status: "pending",
        amount: Number(order.amounts.grandTotal),
        currency: CURRENCY.toUpperCase(),
        $push: { 
          attempts: { 
            status: "pending", 
            timestamp: new Date() 
          } 
        },
        metadata: { 
          sessionId: session.id,
          sessionUrl: session.url,
          latestStatus: "pending"
        }
      },
      { upsert: true, new: true }
    );

    // Update Order
    order.payment = {
      ...(order.payment || {}),
      method: "card",
      status: "unpaid",
      sessionId: session.id,
      txId: tempIntentId,
      amount: Number(order.amounts.grandTotal),
      currency: CURRENCY.toUpperCase(),
    };
    await order.save();

    console.log("✅ Order updated with payment info");

    res.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      dashboardUrl: `https://dashboard.stripe.com/test/events`,
    });

  } catch (err) {
    console.error("❌ create-checkout error:", err?.raw || err);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
});
/**
 * B) to backend for testing    ==?>>    confirm payment
 * POST /api/payments/test-confirm/:orderId
  * - for testing purpose only
 */
router.post("/test-confirm/:orderId", verifyJWT, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { payment_method } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid orderId" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const me = String(req.user._id || req.user.id);
    if (String(order.userId) !== me) return res.status(403).json({ message: "Forbidden" });
    if (order.status !== "pending") return res.status(400).json({ message: `Order is ${order.status}` });

    const amountInMinor = Math.round(Number(order.amounts.grandTotal) * 100);

    const pi = await stripe.paymentIntents.create({
      amount: amountInMinor,
      currency: CURRENCY,
    //   payment_method_types: ["card"],
      automatic_payment_methods: {
       enabled: true,
       allow_redirects: "never"   // 👈
      },
      confirm: true,
      payment_method: payment_method || "pm_card_visa", // test card 
      metadata: { orderId: String(order._id), userId: me }
    });

    // paymentIntent created & confirmed successfully
    await Payment.findOneAndUpdate(
      { provider: "stripe", intentId: pi.id },
      {
        orderId: order._id,
        userId: order.userId,
        provider: "stripe",
        intentId: pi.id,
        status: pi.status || "succeeded",
        amount: Number(order.amounts.grandTotal),
        currency: CURRENCY.toUpperCase(),
        $push: { attempts: { status: pi.status || "succeeded" } },
        metadata: { latestStatus: pi.status }
      },
      { upsert: true, new: true }
    );

    if (pi.status !== "succeeded") {
      return res.status(400).json({ message: `Payment not succeeded: ${pi.status}` });
    }

    //order update with payment info
    order.status = "paid";
    order.payment = {
      ...(order.payment || {}),
      method: "card",
      status: "paid",
      txId: pi.id,
      amount: Number(order.amounts.grandTotal),
      currency: CURRENCY.toUpperCase(),
      paidAt: new Date()
    };
    await order.save();

    res.json({
      message: "✅ Payment succeeded & order marked as paid",
      order,
      paymentIntent: { id: pi.id, status: pi.status }
    });
  } catch (err) {
    console.error("test-confirm error:", err?.raw || err);
    res.status(500).json({ message: "Payment failed", error: err.message });
  }
});

export default router;
