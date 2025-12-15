const {filters} = require('../models/filter')
const {ctrlWrapper} = require("../helpers");
const sendTelegramMessage = require("../helpers/telegram");

const getAll = async (req, res) => {
	try {
		const result = await filters.find();
		res.json(result);
	} catch (e) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/filters/getAll): ${e.message}\n\n`
		);
		console.error(e);
		throw e;
	}
}

module.exports = {
	getAll: ctrlWrapper(getAll),
}