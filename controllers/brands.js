const {HttpError, ctrlWrapper} = require("../helpers");
const {Brand} = require("../models/brand");

const sendTelegramMessage = require("../helpers/telegram");

const getAllBrands = async (req, res) => {
	try {
		const result = await Brand.find();

		res.json(result);
	} catch (e) {
		await sendTelegramMessage(
			"Backend. controllers/brands/getAllBrands",
			`Error: ${e.message}`
		);
		console.error(e);
		throw e;
	}
};

const getByBrand = async (req, res) => {
	try {
		function escapeRegExp(str = "") {
			return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		}

		const {name} = req.params;
		const safe = escapeRegExp(name);
		const result = await Brand.findOne({name: new RegExp(`^${safe}$`, "i")});

		if (!result) {
			throw HttpError(404, "Not found");
		}

		res.json(result);
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				"Backend. controllers/brands/getByBrand",
				`Error: ${e.message}`
			);
		}
		console.error(e);
		throw e;
	}
};

const addBrand = async (req, res) => {
	try {
		const existing = await Brand.findOne({
			name: new RegExp(`^${req.body.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
		});
		if (existing) {
			throw HttpError(409, "Бренд з такою назвою вже існує", {isCustom: true});
		}
		const result = await Brand.create(req.body);
		res.status(201).json(result);
	} catch (e) {
		if (e.status !== 409) {
			await sendTelegramMessage(
				"Backend. controllers/brands/addBrand",
				`Error: ${e.message}`
			);
		}
		console.error(e);
		throw e;
	}
};

const updateBrand = async (req, res) => {
	try {
		const {id} = req.params;
		const result = await Brand.findByIdAndUpdate(id, req.body, {new: true});
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.json(result);
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				"Backend. controllers/brands/updateBrand",
				`Error: ${e.message}`
			);
		}
		console.error(e);
		throw e;
	}
};

const deleteBrand = async (req, res) => {
	try {
		const {id} = req.params;
		const result = await Brand.findByIdAndDelete(id);
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.json({message: "Delete success"});
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				"Backend. controllers/brands/deleteBrand",
				`Error: ${e.message}`
			);
		}
		console.error(e);
		throw e;
	}
};

module.exports = {
	getAllBrands: ctrlWrapper(getAllBrands),
	getByBrand:   ctrlWrapper(getByBrand),
	addBrand:     ctrlWrapper(addBrand),
	updateBrand:  ctrlWrapper(updateBrand),
	deleteBrand:  ctrlWrapper(deleteBrand),
};
