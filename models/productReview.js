const {Schema, model} = require('mongoose');
const Joi = require("joi");
const {handleMongooseError} = require('../helpers')

const productReviewsSchema = new Schema({
	productId: {
		type:     Number,
		required: true,
	},
	email:     {
		type:     String,
		required: true
	},
	firstName: {
		type:     String,
		required: true
	},
	rate:      {
		type:     Number,
		required: true,
	},
	message:   {
		type:     String,
		required: false,
	},
	image:     {
		type:     String,
		required: false,
	}
}, {versionKey: false, timestamps: true})

productReviewsSchema.post('save', handleMongooseError)

const addSchema = Joi.object({
	productId: Joi.number().required(),
	email:     Joi.string().required(),
	firstName: Joi.string().required(),
	rate:      Joi.number().required(),
	message:   Joi.string().allow(''),
	image:     Joi.string().allow(null),
})

const schemas = {
	addSchema,
}

const productReviews = model("productReview", productReviewsSchema)

module.exports = {
	productReviews,
	schemas,
}