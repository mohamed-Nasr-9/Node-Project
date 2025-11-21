import Review from "../models/reviewModel.js";
import Book from "../models/Book.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { winstonLogger } from "../config/logger.js";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.GROQ_API_KEY;
const MODEL  = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

const filterReview = async (revieww) => {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 256,
        messages: [
          {
            role: "system",
            content:
              "You are a text-filtering assistant. When I provide you with any text in Arabic, English, or any human language, you must scan it for offensive, insulting, or inappropriate words. For every offensive word you identify, replace all of its characters with asterisks (****). After modifying the text, return only the filtered text and nothing else.",
          },
          { role: "user", content: revieww },
        ],
      }),
    });

    if (!response.ok) {
      return "";
    }

    const data = await response.json();
    const filterdReview = data?.choices?.[0]?.message?.content ?? "";

    return filterdReview;

  } catch (err) {
    return "";
  }
}

const updateBookRating = async (bookId) => {
  try {
    const reviews = await Review.find({ bookId });

    const ratingCount = reviews.length;

    if (ratingCount === 0) {
      await Book.findByIdAndUpdate(bookId, {
        ratingAvg: 0,
        ratingCount: 0,
      });
      return;
    }

    const ratingSum = reviews.reduce((acc, item) => acc + item.rating, 0);
    const ratingAvg = (ratingSum / ratingCount).toFixed(1);

    await Book.findByIdAndUpdate(bookId, {
      ratingAvg,
      ratingCount,
    });
  } catch (error) {
    winstonLogger.error(`Failed to update book rating for ${bookId}:`, error);
    console.error(`Failed to update book rating for ${bookId}:`, error);
  }
};

export const getBookReviews = async (req, res) => {
  try {
    const { bookId } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = { bookId: bookId };

    const [reviews, totalItems] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'FirstName LastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Review.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        limit: limit,
      },
      data: reviews,
    });

  } catch (error) {
    winstonLogger.error("Server error while getting the book Reviews", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const tokenUserId = req.user.id;
    const userRole = req.user.role;

    if (userRole === "user" && userId !== tokenUserId) {
      return res.status(403).json({ message: 'You are not allowd' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = { userId: userId };

    const [reviews, totalItems] = await Promise.all([
      Review.find(filter)
        .populate('bookId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Review.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        limit: limit,
      },
      data: reviews,
    });

  } catch (error) {
    winstonLogger.error("Server error while getting the user Reviews", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const { bookId, rating, review } = req.body;
    const userId = req.user.id;

    const hasPurchased = await Order.findOne({
      userId: userId,
      'items.bookId': bookId
    });

    if (!hasPurchased) {
      return res.status(403).json({
        message: 'You can only review books you have purchased.',
      });
    }

    const existingReview = await Review.findOne({ userId, bookId });
    if (existingReview) {
      return res.status(400).json({
        message: 'You have already reviewed this book. You can edit your review.',
      });
    }

    let filterdReview = await filterReview(review);
    if (filterdReview === "") {
      filterdReview = review;
    }

    const newReview = new Review({
      userId,
      bookId,
      rating,
      review: filterdReview
    });
    await newReview.save();

    await updateBookRating(bookId);

    res.status(201).json(newReview);
  } catch (error) {
    winstonLogger.error("Server error on createReview controller", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;

    let reviewDoc = await Review.findById(reviewId);

    if (!reviewDoc) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (reviewDoc.userId.toString() !== userId) {
      return res.status(403).json({
        message: 'Not authorized to update this review',
      });
    }

    let filterdReview = await filterReview(review);
    if (filterdReview === "") {
      filterdReview = review;
    }

    reviewDoc.rating = rating;
    reviewDoc.review = filterdReview;
    await reviewDoc.save();

    await updateBookRating(reviewDoc.bookId);

    res.status(200).json(reviewDoc);
  } catch (error) {
    winstonLogger.error("Server error on updateReview controller", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const reviewDoc = await Review.findById(reviewId);

    if (!reviewDoc) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (reviewDoc.userId.toString() !== userId) {
      return res.status(403).json({
        message: 'Not authorized to delete this review',
      });
    }

    const bookId = reviewDoc.bookId;

    await reviewDoc.deleteOne();

    await updateBookRating(bookId);

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    winstonLogger.error("Server error on deleteReview controller", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};