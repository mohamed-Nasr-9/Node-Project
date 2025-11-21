import Joi from "joi";

export const createReviewSchema = Joi.object({
    bookId: Joi.string().hex().length(24).required(),
    rating: Joi.number().min(1).max(5).required(),
    review: Joi.string().max(500)
});

export const updateReviewSchema = Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    review: Joi.string().max(500)
});

export const queryPaginationSchema = Joi.object({
    page: Joi.number().min(1).max(50).required(),
    limit: Joi.number().min(5).max(50).required()
})