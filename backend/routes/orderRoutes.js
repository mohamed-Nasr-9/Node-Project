import express from "express";
import { simpleCache, clearCacheOnWrite } from "../middleware/cache.js";
import verifyJWT from "../middleware/verifyJWT.js";// import middelware auth
import { getUserOrders,
        getAllOrders,
        placeOrder,
        cancelOrderByAdmin,
        cancelOrderByUser, 
        markAsPaid,
        markAsShipped,
        markAsDelivered } from "../controllers/orderController.js";// import functions from controller  

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admins only" });
};

// route to create order
router.post("/",verifyJWT, clearCacheOnWrite(), placeOrder);

// route to get all orders  for user
router.get("/", verifyJWT, simpleCache(600), getUserOrders);

router.post("/:orderId/cancel", verifyJWT, cancelOrderByUser);


// ----------dashboard admin routes (end points)-----------------------

// route to get all orders to dashboard
router.get("/admin", verifyJWT,requireAdmin, simpleCache(300), getAllOrders);
// cancel order by admin
router.post("/admin/:orderId/cancel", verifyJWT, requireAdmin ,cancelOrderByAdmin); 
router.post("/admin/:orderId/paid", verifyJWT, requireAdmin, markAsPaid);
router.post("/admin/:orderId/shipped", verifyJWT, requireAdmin, markAsShipped);
router.post("/admin/:orderId/delivered", verifyJWT, requireAdmin, markAsDelivered);


export default router ;