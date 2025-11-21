import express from "express";
import verifyJWT from "../middleware/verifyJWT.js";
import roleCheck from "../middleware/roleCheck.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { createReviewSchema, updateReviewSchema, queryPaginationSchema } from "../validators/reviewValidator.js";
import {
    getBookReviews,
    getUserReviews,
    createReview,
    updateReview,
    deleteReview
} from "../controllers/reviewController.js";

const router = express.Router();

router.get("/book/:bookId", validateQuery(queryPaginationSchema), getBookReviews);

router.get("/user/:userId", verifyJWT, roleCheck(["user", "admin"]), validateQuery(queryPaginationSchema), getUserReviews);

router.post("/", verifyJWT, validateBody(createReviewSchema), createReview);

router.put("/:reviewId", verifyJWT, validateBody(updateReviewSchema), updateReview);

router.delete("/:reviewId", verifyJWT, roleCheck(["user", "admin"]), deleteReview);

export default router;