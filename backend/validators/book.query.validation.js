import Joi from "joi";

const objectId = Joi.string().hex().length(24);

export const listBooksQuery = Joi.object({
  q: Joi.string().trim().max(200),                      // text search
  isActive: Joi.boolean().truthy("true").falsy("false"),
  author: objectId,                                     // filter by authorId
  category: objectId,                                   // filter by categoryId
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  // pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(12),
  // sorting: whitelist fields
  sort: Joi.string().valid(
    "price", "-price", "createdAt", "-createdAt", "title", "-title"
  ).default("-createdAt"),
  // projection (optional): comma-separated fields, e.g. "title,price"
  fields: Joi.string().pattern(/^[a-zA-Z0-9_, ]*$/).optional()
});
