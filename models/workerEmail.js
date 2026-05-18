const {Schema, model} = require("mongoose");
const Joi = require("joi");
const {handleMongooseError} = require("../helpers");

const workerEmailEventList = ["order_created"];

const workerEmailSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		events: {
			type: [String],
			enum: workerEmailEventList,
			required: true,
			default: [],
		},
		isActive: {
			type: Boolean,
			required: true,
			default: true,
		},
	},
	{versionKey: false, timestamps: true}
);

workerEmailSchema.post("save", handleMongooseError);

const addSchema = Joi.object({
	email: Joi.string().email().required(),
	events: Joi.array().items(Joi.string().valid(...workerEmailEventList)).default([]),
	isActive: Joi.boolean().default(true),
});

const schemas = {
	addSchema,
};

const WorkerEmail = model("workerEmail", workerEmailSchema);

module.exports = {
	WorkerEmail,
	workerEmailEventList,
	schemas,
};
