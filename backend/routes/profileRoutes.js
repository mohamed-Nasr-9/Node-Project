import express from "express";
import { getProfile, updateProfile ,deleteAccount } from "../controllers/profileController.js";
import verifyJWT from "../middleware/verifyJWT.js";
import {getUserOrders} from "../controllers/orderController.js";
import {getCartAuth ,updateCartItemAuth ,removeFromCartAuth } from "../controllers/cart.controller.js";
import { requestRestoreAccount, restoreAccount , AddAddress , updateAddress , deleteAddress } from "../controllers/profileController.js";
const router = express.Router();

router.get("/getprofile", verifyJWT, getProfile);
router.patch("/updateprofile", verifyJWT, updateProfile);
router.delete("/deleteprofile", verifyJWT, deleteAccount);

router.get("/getuserorders", verifyJWT, getUserOrders);
router.get("/getcart", verifyJWT, getCartAuth);
router.patch("/updatecartitem", verifyJWT, updateCartItemAuth);
router.delete("/removefromcart", verifyJWT, removeFromCartAuth);

router.post("/request-restore", requestRestoreAccount);
router.get("/restore/:token", restoreAccount);

router.post("/addaddress", verifyJWT, AddAddress);
router.patch("/updateaddress", verifyJWT, updateAddress);
router.delete("/deleteaddress", verifyJWT, deleteAddress);
export default router;