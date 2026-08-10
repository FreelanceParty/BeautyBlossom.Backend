const {Schema, model} = require("mongoose");
const Joi = require("joi");
const {handleMongooseError} = require("../helpers");

// const statusList = ['на складі', 'в роботі'];
const basketShema = new Schema(
	{
		owner:       {
			type:     Schema.Types.ObjectId,
			ref:      "user",
			required: false,
		},
		name:        String,
		article:     String,
		code:        Number,
		productId:   Number,
		amount:      Number,
		description: String,
		priceOPT:    Number,
		priceDrop:   Number,
		quantity:    Number,
		price:       Number,
		brand:       String,
		images:      String,
		new:         {
			type:    Boolean,
			default: false,
		},
		sale:        {
			type:    Boolean,
			default: false,
		},

		createdAt: {
			type:    Date,
			default: Date.now,
		},

		basketCreatedAt: {
			type:    Date,
			default: Date.now,
		},

		category:       String,
		subCategory:    String,
		subSubCategory: String,

		// status: {
		//     type: String,
		//     enum: statusList,
		//     required: true,
		// }
	},
	{versionKey: false, timestamps: true}
);

basketShema.post("save", handleMongooseError);

const addSchema = Joi.object({
	name:        Joi.string().required(),
	article:     Joi.string().required(),
	productId:   Joi.number().required(),
	code:        Joi.number().required(),
	amount:      Joi.number(),
	description: Joi.string().required(),
	priceOPT:    Joi.number().required(),
	priceDrop:   Joi.number().default(0),
	quantity:    Joi.number().required(),
	price:       Joi.number().required(),
	brand:       Joi.string().required(),
	images:      Joi.string().required(),
	new:         Joi.boolean().default(false),
	sale:        Joi.boolean().required(),
	// status: Joi.string().valid(...statusList).required(),
	category:        Joi.string(),
	subCategory:     Joi.string().allow('', null).optional(),
	subSubCategory:  Joi.string().allow('', null).optional(),
	createdAt:       Joi.date(),
	basketCreatedAt: Joi.date(),
});

const updateChekedSchema = Joi.object({
	checked: Joi.boolean().required(),
});

const schemas = {
	addSchema,
	updateChekedSchema,
};

const basket = model("basket", basketShema);

module.exports = {
	basket,
	schemas,
};
