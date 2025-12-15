const {Schema, model} = require('mongoose');
const {handleMongooseError} = require('../helpers')

const filterSchema = new Schema({
	id:          Number,
	category:    String,
	subCategory: String,
	slug:        String,
	code:        String,
}, {versionKey: false, timestamps: true})

filterSchema.post('save', handleMongooseError)

const schemas = {
	filterSchema,
}

const filters = model("filter", filterSchema)

module.exports = {
	filters,
	schemas,
}