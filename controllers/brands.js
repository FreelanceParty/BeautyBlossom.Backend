const {HttpError, ctrlWrapper} = require("../helpers");
const {Brand} = require("../models/brand");

const getAllBrands = async (req, res) => {
	const result = await Brand.find();

	res.json(result);
};

const getByBrand = async (req, res) => {
	const {name} = req.params;
	const result = await Brand.findOne({name: new RegExp(`^${name}$`, "i")});

	if (!result) {
		throw HttpError(404, "Not found");
	}

	res.json(result);
};

module.exports = {
	getAllBrands: ctrlWrapper(getAllBrands),
	getByBrand:   ctrlWrapper(getByBrand),
};
