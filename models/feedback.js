const {Schema, model} = require('mongoose');
const Joi = require("joi");
const {handleMongooseError} = require('../helpers')

const feedbackSchema = new Schema({
	feedbacks: {
		type:     String,
		required: true
	},
	owner:     {
		type:     Schema.Types.ObjectId,
		ref:      "user",
		required: false,
	}
}, {versionKey: false, timestamps: true})

feedbackSchema.post('save', handleMongooseError)
// якщо при спробы сейв сталась помилка виконай цю мідлвар

const addSchema = Joi.object({
	feedbacks: Joi.string().required(),
})

const updateChekedSchema = Joi.object({
	checked: Joi.boolean().required(),
})

const schemas = {
	addSchema,
	updateChekedSchema,
}

const feedback = model("feedback", feedbackSchema)

module.exports = {
	feedback,
	schemas,
}