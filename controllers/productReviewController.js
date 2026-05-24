const ProductReview = require('../models/productReview').productReviews;
const {Goods} = require("../models/goods");
const {ctrlWrapper} = require("../helpers");

const sendTelegramMessage = require("../helpers/telegram");

const recomputeGoodsReviewStats = async (productId) => {
	const numericProductId = Number(productId);
	if (!Number.isFinite(numericProductId)) {
		return;
	}

	const [stats] = await ProductReview.aggregate([
		{$match: {productId: numericProductId}},
		{
			$group: {
				_id:   "$productId",
				count: {$sum: 1},
				avg:   {$avg: "$rate"},
			},
		},
	]);

	const reviewsCount = stats?.count ?? 0;
	const reviewsAvg = stats?.avg ? Math.round(stats.avg * 10) / 10 : 0;

	await Goods.findOneAndUpdate(
		{id: numericProductId},
		{reviewsCount, reviewsAvg},
		{new: false}
	);
};

const add = async (req, res) => {
	try {
		const {body} = req;
		const dataToSave = {...body};
		if (req.file) {
			const file = req.file;

			dataToSave.image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
		}
		const result = await ProductReview.create(dataToSave);
		try {
			await recomputeGoodsReviewStats(result.productId);
		} catch (e) {
			await sendTelegramMessage(
				"Backend. controllers/productReviewController/recomputeGoodsReviewStats",
				e.message
			);
			console.error(e);
		}
		res.status(201).json(result);
	} catch (e) {
		await sendTelegramMessage(
			"Backend. controllers/productReviewController/add",
			`Error: ${e.message}`
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
			"Backend. controllers/productReviewController/getAllForProduct",
			`Error: ${e.message}\nProduct ID: ${req.params.id}`
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
			"Backend. controllers/productReviewController/getAll",
			`Error: ${e.message}`
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