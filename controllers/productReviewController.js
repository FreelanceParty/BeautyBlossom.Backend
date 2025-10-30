const ProductReview = require('../models/productReview').productReviews;
const {ctrlWrapper} = require("../helpers");

const add = async (req, res) => {
	const result = await ProductReview.create({...req.body});
	res.status(201).json(result);
}

const getAllForProduct = async (req, res) => {
	const reviews = await ProductReview.find({productId: req.params.id});

	res.json(reviews);
};

const getAll = async (req, res) => {
	const reviews = await ProductReview.find({});

	res.json(reviews);
};

module.exports = {
	getAllForProduct: ctrlWrapper(getAllForProduct),
	getAll:           ctrlWrapper(getAll),
	add:              ctrlWrapper(add),
}