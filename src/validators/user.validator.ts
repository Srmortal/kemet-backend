import Joi from 'joi';

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  email: Joi.string().email().optional(),
  // Add other fields as needed
}).min(1);
