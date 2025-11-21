// backend/validators/book.validation.js
import Joi from "joi";

const objectId = Joi.string().hex().length(24);
const url = Joi.string().uri({ scheme: ["http", "https"] });

const imageSchema = Joi.object({
  url: url.optional(),
  key: Joi.string().trim().optional(),
});

export const createBookSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(2000).allow("", null),
  price: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).required(),

  pdfUrl: url.optional(),
  image: imageSchema.optional(),

  isbn: Joi.string().trim().max(64).optional(),
  sku: Joi.string().trim().max(64).optional(),
  publisher: Joi.string().trim().max(120).optional(),
  language: Joi.string().trim().max(60).optional(),
  publishedAt: Joi.date().iso().optional(),

  authors: Joi.array().items(objectId).default([]),
  categories: Joi.array().items(objectId).default([]),

  isActive: Joi.boolean().default(true),

  // server-controlled fields can be allowed but not required:
  ratingAvg: Joi.number().min(0).max(5).optional(),
  ratingCount: Joi.number().integer().min(0).optional(),
});

export const updateBookSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  description: Joi.string().trim().max(2000).allow("", null),
  price: Joi.number().min(0),
  stock: Joi.number().integer().min(0),

  pdfUrl: url,
  image: imageSchema,

  isbn: Joi.string().trim().max(64),
  sku: Joi.string().trim().max(64),
  publisher: Joi.string().trim().max(120),
  language: Joi.string().trim().max(60),
  publishedAt: Joi.date().iso(),

  authors: Joi.array().items(objectId),
  categories: Joi.array().items(objectId),

  isActive: Joi.boolean(),
  ratingAvg: Joi.number().min(0).max(5),
  ratingCount: Joi.number().integer().min(0),
}).min(1); // require at least one field on updates
