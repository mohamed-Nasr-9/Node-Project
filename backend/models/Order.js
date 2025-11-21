import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",//reference User model 
            required: true,
        },
        status: {
            type: String,
             enum: [
              "pending",     // تم إنشاء الطلب ولم يُدفع بعد
              "paid",        // دُفع بنجاح
              "processing",  // (اختياري) جاري التجهيز
              "confirmed",   // (اختياري) تم التأكيد
              "shipped",     // تم الشحن
              "delivered",   // تم التسليم
              "cancelled",   // تم الإلغاء قبل الشحن
              "refunded"     // تم الاسترجاع بعد الدفع
            ],
            default: "pending",
        },
        cancelledAt: { type: Date },
        cancelledBy: {
                     id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                     role: { type: String, enum: ["user", "admin"] }
                    },
        cancelReason: { type: String },
        paidAt: { type: Date },
        shippedAt: { type: Date },
        deliveredAt: { type: Date },
        trackingNumber: { type: String },
        carrier: { type: String },
        adminNote: { type: String },
        currency: { type: String, default: "EGP" },
        items: [
            {
                _id: false, 
                bookId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Book",//reference Book model 
                    required: true,
                },
                titleSnapshot: String,
                priceAtAdd: { type: Number, min: 0, required: true , alias: "price" },
                qty: { type: Number, min: 1, required: true },
            },
        ],
        shippingAddress: {
            label: String,
            fullName: String,
            phone: String,
            line1: String,
            line2: String,
            city: String,
            state: String,
            country: String,
            postalCode: String,
        },
        payment: {
            method: String, // cash - visa - paypal - etc
            status: String, // unpaid - paid - failed
            txId: String,   // transaction id  
        },
        amounts: {
            itemsTotal: { type: Number, min: 0, default: 0 },
            shipping: { type: Number, min: 0, default: 0 },
            discount: { type: Number, min: 0, default: 0 },
            grandTotal: { type: Number, min: 0, default: 0 },
        },
        placedAt: { type: Date, default: Date.now },
    },
);

export default mongoose.model("Order", orderSchema);