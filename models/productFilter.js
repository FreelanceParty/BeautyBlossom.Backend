const {Schema, model} = require('mongoose');
const {handleMongooseError} = require('../helpers');

const schema = new Schema({
	code:    Number,
	name:    String,
	filter1: String,
	filter2: String,
	filter3: String,
	filter4: String,
	filter5: String,
	filter6: String,
}, {versionKey: false, timestamps: true});

schema.post('save', handleMongooseError);

const schemas = {
	schema,
};

const productFilters = model("productFilters", schema);

module.exports = {
	productFilters,
	schemas,
};