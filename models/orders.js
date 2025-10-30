const {Schema, model} = require('mongoose');
const Joi = require("joi");
const {handleMongooseError} = require('../helpers')

const statusList = ['Новий', 'Прийняте в роботу', 'Збирається', 'Зібрано', 'Відправлено', 'Відміна']

const ordersSchema = new Schema({
	owner:          {
		type:     String,
		ref:      "user",
		required: false,
	},
	isOptUser:      {
		type:     Boolean,
		required: false
	},
	email:          {
		type:     String,
		required: true
	},
	firstName:      {
		type:     String,
		required: true
	},
	lastName:       {
		type:     String,
		required: true
	},
	number:         {
		type:     Number,
		required: true
	},
	city:           {
		type:     String,
		required: true
	},
	warehouse:      {
		type:     String,
		required: false
	},
	paymentMethod:  {
		type:     String,
		required: true
	},
	comments:       {
		type:     String,
		required: false
	},
	amount:         {
		type:     Number,
		required: true
	},
	deliveryMethod: {
		type:     String,
		required: true
	},
	status:         {
		type:     String,
		enum:     statusList,
		required: true
	},
	address:        {
		type:     String,
		required: false
	},
	building:       {
		type:     String,
		required: false
	},
	apartment:      {
		type:     String,
		required: false
	},
	orderNumber:    {
		type:     String,
		required: true
	},

	orderedItems: [
		{
			productId: {
				type:     String,
				required: true
			},
			images:    {
				type: String,

			},
			code:      {
				type:     String,
				required: true
			},
			amount:    {
				type:     Number,
				required: true
			},
			name:      {
				type:     String,
				required: true
			},
			quantity:  {
				type:     Number,
				required: true
			},
			sale:      {
				type:     Boolean,
				required: false
			}
		},
	],
}, {versionKey: false, timestamps: true})

ordersSchema.post('save', handleMongooseError)
// якщо при спробы сейв сталась помилка виконай цю мідлвар

const addSchema = Joi.object({
	email:          Joi.string().required(),
	firstName:      Joi.string().required(),
	lastName:       Joi.string().required(),
	number:         Joi.number().required(),
	city:           Joi.string().required(),
	warehouse:      Joi.string(),
	paymentMethod:  Joi.string().required(),
	comments:       Joi.string(),
	amount:         Joi.number().required(),
	deliveryMethod: Joi.string().required(),
	status:         Joi.string().valid(...statusList).required(),
	address:        Joi.string(),
	building:       Joi.string(),
	apartment:      Joi.string(),
	isOptUser:      Joi.boolean(),
	orderNumber:    Joi.string(),
	orderedItems:   Joi.array().items(Joi.object({
		productId: Joi.number().required(),
		name:      Joi.string().required(),
		quantity:  Joi.number().required(),
		amount:    Joi.number().required(),
		images:    Joi.string(),
		code:      Joi.string().required(),
		sale:      Joi.bool()
	})).required()

})

const updateChekedSchema = Joi.object({
	checked: Joi.boolean().required(),
})

const schemas = {
	addSchema,
	updateChekedSchema,
}

const orders = model("orders", ordersSchema)

module.exports = {
	orders,
	schemas,
}