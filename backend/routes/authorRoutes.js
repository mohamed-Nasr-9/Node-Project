// routes/authorRoutes.js
import express from "express";
import verifyJWT from "../middleware/verifyJWT.js";
import roleCheck from "../middleware/roleCheck.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { simpleCache, clearCacheOnWrite } from "../middleware/cache.js";

import {
  listAuthors,
  getAuthor,
  applyAsAuthor,
  getMyAuthor,
  approveAuthor,
  rejectAuthor,
  revokeAuthor,
  deleteAuthor
} from "../controllers/authorController.js";

import {
  applyAsAuthorSchema,
  adminApproveSchema,
  adminRejectSchema,
  listAuthorsQuery
} from "../validators/author.validation.js";

const router = express.Router();

/* ===============================
   PUBLIC / GENERAL ROUTES
   =============================== */

// List authors (anyone can view, with optional query filters)
router.get("/", simpleCache(1800), validateQuery(listAuthorsQuery), listAuthors);

// Get a single author profile by ID
router.get("/:id", simpleCache(1800), getAuthor);

/* ===============================
   USER ROUTES (must be logged in)
   =============================== */

// Apply to become an author
router.post(
  "/apply",
  verifyJWT,
  validateBody(applyAsAuthorSchema),
  clearCacheOnWrite(),
  applyAsAuthor
);

// Get the logged-in user's author record (their own application/profile)
router.get("/me/profile", verifyJWT, getMyAuthor);

/* ===============================
   ADMIN ROUTES
   =============================== */

// Approve a pending author
router.patch(
  "/:id/approve",
  verifyJWT,
  roleCheck(["admin"]),
  validateBody(adminApproveSchema),
  clearCacheOnWrite(),
  approveAuthor
);

// Reject a pending author
router.patch(
  "/:id/reject",
  verifyJWT,
  roleCheck(["admin"]),
  validateBody(adminRejectSchema),
  clearCacheOnWrite(),
  rejectAuthor
);
// Revoke an approved author's privileges
router.patch(
  "/:id/revoke",
  verifyJWT,
  roleCheck(["admin"]),
  clearCacheOnWrite(),
  revokeAuthor
);


// Hard delete an author record
router.delete(
  "/:id",
  verifyJWT,
  roleCheck(["admin"]),
  clearCacheOnWrite(),
  deleteAuthor
);

export default router;
