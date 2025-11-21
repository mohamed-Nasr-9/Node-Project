import Cart from "../models/cart.model.js";
import Book from "../models/Book.js";
import mongoose from "mongoose";

export const getCartAuth = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    const cart = await Cart.findOne({ userId: userObjectId })
      .populate('items.bookId', 'title price author stock image');

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Cart is empty',
        data: {
          userId: req.user.id,
          items: [],
          totals: { subTotal: 0 }
        }
      });
    }

    // Check stock availability for all items
    const itemsWithStockStatus = cart.items.map(item => {
      const book = item.bookId;
      return {
        ...item.toObject(),
        stockAvailable: book ? book.stock : 0,
        isInStock: book ? book.stock >= item.qty : false
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...cart.toObject(),
        items: itemsWithStockStatus
      }
    });
  } catch (error) {
    console.error('Error in getCartAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cart',
      error: error.message
    });
  }
};

export const addToCartAuth = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const bookObjectId = new mongoose.Types.ObjectId(req.body.bookId);
    const qtyValue = parseInt(req.body.qty || 1);

    // Validate quantity
    if (qtyValue < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Get book from database (TRUSTED source for price)
    const book = await Book.findById(bookObjectId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book is active
    if (book.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Book is not available for purchase'
      });
    }

    // Use price from DATABASE, not from user input!
    const priceAtAdd = book.price;

    let cart = await Cart.findOne({ userId: userObjectId });

    if (!cart) {
      cart = new Cart({
        userId: userObjectId,
        items: [],
        totals: { subTotal: 0 }
      });
    }

    const existingItemIndex = cart.items.findIndex(
      item => item.bookId.toString() === bookObjectId.toString()
    );

    let newQuantity;

    if (existingItemIndex > -1) {
      // Book exists in cart, add to existing quantity
      newQuantity = cart.items[existingItemIndex].qty + qtyValue;
    } else {
      // New book
      newQuantity = qtyValue;
    }

    // Validate stock availability
    if (book.stock < newQuantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${book.stock}, Requested: ${newQuantity}`,
        availableStock: book.stock,
        requestedQuantity: newQuantity
      });
    }

    // Update cart
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].qty = newQuantity;
      // Update price in case it changed
      cart.items[existingItemIndex].priceAtAdd = priceAtAdd;
    } else {
      cart.items.push({
        bookId: bookObjectId,
        qty: newQuantity,
        priceAtAdd: priceAtAdd  // From database
      });
    }

    // Recalculate total
    cart.totals.subTotal = cart.items.reduce((total, item) => {
      return total + item.priceAtAdd * item.qty;
    }, 0);

    await cart.save();

    // Populate book details
    await cart.populate('items.bookId', 'title price author stock image');

    res.status(200).json({
      success: true,
      message: 'Book added to cart successfully',
      data: cart
    });
  } catch (error) {
    console.error('Error in addToCartAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to cart',
      error: error.message
    });
  }
};

export const updateCartItemAuth = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const { bookId, qty } = req.body;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'Book ID is required'
      });
    }

    if (!qty || qty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const bookObjectId = new mongoose.Types.ObjectId(bookId);

    // Check book stock
    const book = await Book.findById(bookObjectId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Validate stock
    if (book.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${book.stock}, Requested: ${qty}`,
        availableStock: book.stock,
        requestedQuantity: qty
      });
    }

    const cart = await Cart.findOne({ userId: userObjectId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.bookId.toString() === bookObjectId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Book not found in cart'
      });
    }

    // Update quantity
    cart.items[itemIndex].qty = qty;

    // Recalculate total
    cart.totals.subTotal = cart.items.reduce((total, item) => {
      return total + (item.priceAtAdd * item.qty);
    }, 0);

    await cart.save();

    // Populate book details
    await cart.populate('items.bookId', 'title price author stock image');

    res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      data: cart
    });
  } catch (error) {
    console.error('Error in updateCartItemAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart',
      error: error.message
    });
  }
};

export const removeFromCartAuth = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const { bookId } = req.params;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'Book ID is required'
      });
    }

    const bookObjectId = new mongoose.Types.ObjectId(bookId);
    const cart = await Cart.findOne({ userId: userObjectId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Remove item
    cart.items = cart.items.filter(
      item => item.bookId.toString() !== bookObjectId.toString()
    );

    // Recalculate total
    cart.totals.subTotal = cart.items.reduce((total, item) => {
      return total + (item.priceAtAdd * item.qty);
    }, 0);

    await cart.save();

    // Populate book details
    await cart.populate('items.bookId', 'title price author stock image');

    res.status(200).json({
      success: true,
      message: 'Book removed from cart successfully',
      data: cart
    });
  } catch (error) {
    console.error('Error in removeFromCartAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from cart',
      error: error.message
    });
  }
};

export const clearCartAuth = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const cart = await Cart.findOne({ userId: userObjectId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Clear all items
    cart.items = [];
    cart.totals.subTotal = 0;

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart
    });
  } catch (error) {
    console.error('Error in clearCartAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
};


export const validateCartStock = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    const cart = await Cart.findOne({ userId: userObjectId })
      .populate('items.bookId', 'title price stock isActive');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    const validationResults = [];
    let allValid = true;

    for (const item of cart.items) {
      const book = item.bookId;

      if (!book) {
        validationResults.push({
          bookId: item.bookId,
          valid: false,
          reason: 'Book not found'
        });
        allValid = false;
        continue;
      }

      if (book.isActive === false) {
        validationResults.push({
          bookId: book._id,
          title: book.title,
          valid: false,
          reason: 'Book is no longer available'
        });
        allValid = false;
        continue;
      }

      if (book.stock < item.qty) {
        validationResults.push({
          bookId: book._id,
          title: book.title,
          valid: false,
          reason: 'Insufficient stock',
          available: book.stock,
          requested: item.qty
        });
        allValid = false;
        continue;
      }

      validationResults.push({
        bookId: book._id,
        title: book.title,
        valid: true
      });
    }

    res.status(200).json({
      success: true,
      allValid: allValid,
      items: validationResults
    });
  } catch (error) {
    console.error('Error in validateCartStock:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating cart',
      error: error.message
    });
  }
};