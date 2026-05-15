const {Schema, model} = require('mongoose');
const Joi = require("joi");
const {handleMongooseError} = require('../helpers');

// const statusList = ['на складі', 'в роботі'];
const goodsSchema = new Schema({
	name:         String,
	article:      String,
	code:         Number,
	amount:       Number,
	description:  String,
	priceOPT:     Number,
	price:        Number,
	brand:        String,
	images:       String,
	country:      String,
	availability: String,
	id:           Number,

	title:     String,
	condition: String,

	new:            {
		type:    Boolean,
		default: false,
	},
	sale:           {
		type:    Boolean,
		default: false,
	},
	category:       String,
	subCategory:    String,
	subSubCategory: String,
	owner:          {
		type:     Schema.Types.ObjectId,
		ref:      "user",
		required: false,
	},
	// status: {
	//     type: String,
	//     enum: statusList,
	//     required: true,
	// }
}, {versionKey: false, timestamps: true});

goodsSchema.post('save', handleMongooseError);

const addSchema = Joi.object({
	name:         Joi.string().required(),
	article:      Joi.string().required(),
	code:         Joi.number().required(),
	amount:       Joi.number().required(),
	description:  Joi.string().required(),
	priceOPT:     Joi.number().required(),
	price:        Joi.number().required(),
	brand:        Joi.string().required(),
	images:       Joi.string().required(),
	new:          Joi.boolean().default(false),
	sale:         Joi.boolean().required(),
	country:      Joi.string().required(),
	availability: Joi.string(),
	title:        Joi.string(),
	condition:    Joi.string(),
	id:           Joi.number(),
	// status: Joi.string().valid(...statusList).required(),
	category:       Joi.string().required(),
	subCategory:    Joi.string().allow('').optional(),
	subSubCategory: Joi.string().allow('').optional(),
});

const updateChekedSchema = Joi.object({
	checked: Joi.boolean().required(),
});

const updateAmountSchema = Joi.object({
	amount: Joi.number().required(),
});

const schemas = {
	addSchema,
	updateChekedSchema,
	updateAmountSchema,
};

const Goods = model("goods", goodsSchema);

module.exports = {
	Goods,
	schemas,
};