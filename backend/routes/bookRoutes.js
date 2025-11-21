// routes/bookRoutes.js
import express from "express";
import verifyJWT from "../middleware/verifyJWT.js";
import roleCheck from "../middleware/roleCheck.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { simpleCache, clearCacheOnWrite } from "../middleware/cache.js";

import {
  listBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook
} from "../controllers/bookController.js";

import {
  createBookSchema,
  updateBookSchema
} from "../validators/book.validation.js";

import { listBooksQuery } from "../validators/book.query.validation.js";

const router = express.Router();

/* ===============================
   PUBLIC ROUTES (no login)
   =============================== */

// List all books (with filters, pagination, sorting)
router.get("/", simpleCache(60), validateQuery(listBooksQuery), listBooks);

// Get one book
router.get("/:id", simpleCache(1800), getBook);

/* ===============================
   PROTECTED ROUTES (admin or approved author)
   =============================== */

// Create a new book — must be admin or approved author
router.post(
  "/",
  verifyJWT,
  roleCheck(["admin", "author"]),
  validateBody(createBookSchema),
  clearCacheOnWrite(),
  createBook
);

// Update a book — must be admin or the author who owns it
router.put(
  "/:id",
  verifyJWT,
  roleCheck(["admin", "author"]),
  validateBody(updateBookSchema),
  clearCacheOnWrite(),
  updateBook
);

// Delete (soft or hard) — must be admin or the author who owns it
router.delete(
  "/:id",
  verifyJWT,
  roleCheck(["admin", "author"]),
  clearCacheOnWrite(),
  deleteBook
);

export default router;
