import mongoose from "mongoose";
import Book from "../models/Book.js";
const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  items: [
    {
      bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
      },
      qty: {
        type: Number,
        required: true,
        min: 1,
        default: 1
      },
      priceAtAdd: {
        type: Number,
        required: true
      }
    }
  ],

  totals: {
    subTotal: {
      type: Number,
      required: true,
      default: 0
    }
  }
}, {
  timestamps: true
});

cartSchema.methods.calculateTotal = function () {
  this.totals.subTotal = this.items.reduce((total, item) => {
    return total + (item.priceAtAdd * item.qty);
  }, 0);
  return this.totals.subTotal;
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;