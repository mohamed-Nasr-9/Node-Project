import express from 'express';
import * as cartController from '../controllers/cart.controller.js';
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

router.get('/', verifyJWT, cartController.getCartAuth);

// Body: { bookId, qty }
router.post('/', verifyJWT, cartController.addToCartAuth);

// Body: { bookId, qty }
router.put('/', verifyJWT, cartController.updateCartItemAuth);

// DELETE /api/cart/:bookId - حذف كتاب من الـ Cart
router.delete('/:bookId', verifyJWT, cartController.removeFromCartAuth);

router.delete('/', verifyJWT, cartController.clearCartAuth);

router.post('/validate', verifyJWT, cartController.validateCartStock);


export default router;