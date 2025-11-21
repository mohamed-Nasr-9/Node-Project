import { multerUploadImage, multerUploadBook } from "../config/multer.js";
import Book from "../models/Book.js";
import { winstonLogger } from "../config/logger.js";

export const uploadImage = async (req, res) => {
  try {
    const { bookId } = req.params;

    let bookDoc = await Book.findById(bookId);
    if (!bookDoc) {
      return res.status(404).json({ message: 'Book not found' });
    }

    multerUploadImage(req, res, async (error) => {
      if (error) {
        winstonLogger.warn(`Failed to upload image ${error}`);
        return res.status(400).send(error.message);
      }

      try {
        bookDoc.image.url = req.file.location;
        await bookDoc.save();

        res.send({ message: "Image uploaded successfully" });

      } catch (error) {
        winstonLogger.error(`Failed to save book to DB: ${error.message}`);
        res.status(500).json({ 
          message: "File uploaded but failed to save to database.", 
          error: error.message 
        });
      }
    });

  } catch (error) {
    winstonLogger.error(`Error finding book to upload image for: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const uploadBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    let bookDoc = await Book.findById(bookId);
    if (!bookDoc) {
      return res.status(404).json({ message: 'Book not found' });
    }

    multerUploadBook(req, res, async (error) => {
      if (error) {
        winstonLogger.warn(`Failed to upload book ${error}`);
        return res.status(400).send(error.message);
      }

      try {
        bookDoc.pdfUrl = req.file.location;
        await bookDoc.save();

        res.send({ message: "Book uploaded successfully" });

      } catch (error) {

        winstonLogger.error(`Failed to save book to DB: ${error.message}`);
        res.status(500).json({ 
          message: "File uploaded but failed to save to database.", 
          error: error.message 
        });
      }
    });

  } catch (error) {
    winstonLogger.error(`Error finding book to upload pdf for: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};