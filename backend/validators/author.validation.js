// validators/author.validation.js
import Joi from "joi";

/**
 * USER applies to become an author
 * Used in POST /api/authors/apply
 */
export const applyAsAuthorSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(80)
    .required()
    .messages({
      "string.empty": "Name is required",
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name must be at most 80 characters"
    }),
  bio: Joi.string()
    .max(2000)
    .allow("", null)
    .messages({
      "string.max": "Bio must be less than 2000 characters"
    })
});

/**
 * ADMIN approves an author
 * Used in PATCH /api/authors/:id/approve
 */
export const adminApproveSchema = Joi.object({
  name: Joi.string().min(2).max(80).optional(),
  bio: Joi.string().max(2000).allow("", null).optional()
}).unknown(false); // disallow extra fields

/**
 * ADMIN rejects an author
 * Used in PATCH /api/authors/:id/reject
 */
export const adminRejectSchema = Joi.object({
  reason: Joi.string()
    .max(1000)
    .allow("", null)
    .messages({
      "string.max": "Reason must be less than 1000 characters"
    })
}).unknown(false);

/**
 * Admin or public list filter query
 * Used in GET /api/authors
 */
export const listAuthorsQuery = Joi.object({
  status: Joi.string().valid("pending", "approved", "rejected").optional(),
  q: Joi.string().max(120).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string()
    .valid("name", "-name", "createdAt", "-createdAt", "appliedAt", "-appliedAt")
    .default("name")
});
