const {filters} = require('../models/filter')
const {ctrlWrapper} = require("../helpers");
const sendTelegramMessage = require("../helpers/telegram");

const getAll = async (req, res) => {
	try {
		const result = await filters.find();
		res.json(result);
	} catch (e) {
		await sendTelegramMessage(
			"Backend. controllers/filters/getAll",
			`Error: ${e.message}`
		);
		console.error(e);
		throw e;
	}
}

module.exports = {
	getAll: ctrlWrapper(getAll),
}