import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import s3 from "./s3.js";
import dotenv from "dotenv";
import { winstonLogger } from "./logger.js";

dotenv.config();

const imageTypes = /jpg|jpeg|png/;
const bookTypes = /pdf/;

function checkImageType(file, cb) {
  const extname = imageTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = imageTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Error: Only images (jpg, jpeg, png) are allowed"));
  }
}

export const multerUploadImage = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    key: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
      winstonLogger.info(`Image was uploaded: ${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),

  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB file size limit
  fileFilter: function (req, file, cb) {
    checkImageType(file, cb);
  },
}).single("image");

function checkBookType(file, cb) {
  const extname = bookTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = bookTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Error: Only PDFs are allowed"));
  }
}

export const multerUploadBook = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    key: (req, file, cb) => {
      const randCode = Math.random().toString().slice(2, 8);
      cb(null, `${file.fieldname}-${Date.now()}-${randCode}${path.extname(file.originalname)}`);
      winstonLogger.info(`Book was uploaded: ${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),

  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
  fileFilter: function (req, file, cb) {
    checkBookType(file, cb);
  },
}).single("book");