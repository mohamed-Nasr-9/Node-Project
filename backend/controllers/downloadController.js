import Book from "../models/Book.js";
import Order from "../models/Order.js";
import { winstonLogger } from "../config/logger.js";
import s3 from "../config/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

export const getBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.user.id;

    const hasPurchased = await Order.findOne({
      userId: userId,
      "items.bookId": bookId,
      status: { $in: ['paid', 'delivered'] },
    });

    if (!hasPurchased) {
      return res.status(403).json({
        message: "You can only download the books you have purchased.",
      });
    }

    const bookDoc = await Book.findById(bookId);
    if (!bookDoc || !bookDoc.pdfUrl) {
      return res.status(404).json({ message: "Book or book file not found" });
    }

    const s3Url = new URL(bookDoc.pdfUrl);
    const s3Key = s3Url.pathname.substring(1);

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
    });

    const s3Data = await s3.send(command);

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="bookstore-book.pdf"'
    );

    res.setHeader("Content-Type", s3Data.ContentType || "application/pdf");

    s3Data.Body.pipe(res);
    
  } catch (error) {
    winstonLogger.error(`Server error on getting a book ${error}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};