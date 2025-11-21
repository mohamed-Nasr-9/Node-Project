// backend/validators/register.validation.js
import Joi from "joi";

export const registerSchema = Joi.object({
  FirstName: Joi.string().min(2).max(50).required(),
  LastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$"))
    .message("Password must contain at least one uppercase, one lowercase, and one number")
    .required(),
  confirmPassword: Joi.any()
    .valid(Joi.ref("password"))
    .required()
    .messages({ "any.only": "Confirm password does not match password" }),
  addresses: Joi.array()
    .items(
      Joi.object({
        label: Joi.string().required(),
        fullName: Joi.string().required(),
        phone: Joi.string().required(),
        line1: Joi.string().required(),
        line2: Joi.string().allow(""),
        city: Joi.string().required(),
        state: Joi.string().required(),
        country: Joi.string().required(),
        postalCode: Joi.string().required(),
        isDefault: Joi.boolean().default(false)
      })
    )
    .default([]) // lwa mafeesh address yeb2a empty array 3ady
});
