import express from "express";
import { uploadImage, uploadBook } from "../controllers/uploadController.js";
import verifyJWT from "../middleware/verifyJWT.js";
import roleCheck from "../middleware/roleCheck.js";

const router = express.Router();

router.post("/image/:bookId", verifyJWT, roleCheck(["author", "admin"]), uploadImage);

router.post("/book/:bookId", verifyJWT, roleCheck(["author", "admin"]), uploadBook);

export default router;