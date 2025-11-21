import express from "express";
import verifyJWT from "../middleware/verifyJWT.js";
import { getBook } from "../controllers/downloadController.js";

const router = express.Router();

router.get("/book/:bookId", verifyJWT, getBook);

export default router;