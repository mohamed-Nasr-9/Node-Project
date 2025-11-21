import express from "express";
import register from "../controllers/registerController.js";
import verifyEmail from "../controllers/verifyemail.js";
import pass_forgot from "../controllers/forget_passwordController.js";
import pass_reset from "../controllers/reset_passwordController.js"; 
import changePassword from "../controllers/change_passwordController.js";
import verifyJWT from "../middleware/verifyJWT.js";
import {login, logout} from "../controllers/authController.js";
const router = express.Router();


router.post("/register", register);
router.get('/verify/:token', verifyEmail);

router.post("/forgot-password", pass_forgot);
router.post("/reset-password/:token", pass_reset);

router.post("/change-password", verifyJWT, changePassword);

router.post("/login", login);
router.post("/logout", verifyJWT, logout);


export default router;