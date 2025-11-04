const {HttpError, ctrlWrapper} = require("../helpers");
const {Brand} = require("../models/brand");

const sendTelegramMessage = require("../helpers/telegram");

const getAllBrands = async (req, res) => {
	try {
		const result = await Brand.find();

		res.json(result);
	} catch (e) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/brands/getAllBrands): ${e.message}\n\n`
		);
		console.error(e);
		throw e;
	}
};

const getByBrand = async (req, res) => {
	try {
		const {name} = req.params;
		const result = await Brand.findOne({name: new RegExp(`^${name}$`, "i")});

		if (!result) {
			throw HttpError(404, "Not found");
		}

		res.json(result);
	} catch (e) {
		if (e.code !== 404) {
			await sendTelegramMessage(
				`❌ Помилка (Backend. controllers/brands/getByBrand): ${e.message}\n\n`
			);
		}
		console.error(e);
		throw e;
	}
};

module.exports = {
	getAllBrands: ctrlWrapper(getAllBrands),
	getByBrand:   ctrlWrapper(getByBrand),
};
