const ProductReview = require('../models/productReview').productReviews;
const {ctrlWrapper} = require("../helpers");

const sendTelegramMessage = require("../helpers/telegram");

const add = async (req, res) => {
	try {
		const result = await ProductReview.create({...req.body});
		res.status(201).json(result);
	} catch (e) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/productReviewController/add): ${e.message}\n\n`
		);
		console.error(e);
		throw e;
	}
}

const getAllForProduct = async (req, res) => {
	try {
		const reviews = await ProductReview.find({productId: req.params.id});

		res.json(reviews);
	} catch (e) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/productReviewController/getAllForProduct): ${e.message}\n\n`
		);
		console.error(e);
		throw e;
	}
};

const getAll = async (req, res) => {
	try {
		const reviews = await ProductReview.find({});

		res.json(reviews);
	} catch (e) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/productReviewController/getAll): ${e.message}\n\n`
		);
		console.error(e);
		throw e;
	}
};

module.exports = {
	getAllForProduct: ctrlWrapper(getAllForProduct),
	getAll:           ctrlWrapper(getAll),
	add:              ctrlWrapper(add),
}