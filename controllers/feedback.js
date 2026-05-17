// const wood = require("../WoodStorage/wood")

const {feedback} = require('../models/feedback')

const {HttpError, ctrlWrapper} = require("../helpers");

const mongoose = require("mongoose");

const sendTelegramMessage = require("../helpers/telegram");

const getAll = async (req, res) => {
	try {
		const result = await feedback
			.find()
			.populate("owner", "email firstName lastName number");
		res.json(result);
	} catch (e) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/feedback/getAll): ${e.message}\n\n`
		);
		console.error(e);
		throw e;
	}
}

// const getById = async (req, res) => {
//     const { id } = req.params;
//     // const result = await Book.findOne({_id: id})
//     const result = await Production.findById(id);
//     if (!result) {
//         throw HttpError(404, "Not found");
//     }
//     res.json(result);
// }

const add = async (req, res) => {
	try {
		const owner = new mongoose.Types.ObjectId(String(req.user._id));
		const result = await feedback.create({...req.body, owner});
		//  const result = await Wood.create({...req.body});
		res.status(201).json(result);
	} catch (e) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/feedback/add): ${e.message}\n\n`
		);
		console.error(e);
		throw e;
	}
}

// const updateById = async (req, res) => {
//     const { id } = req.params;
//     const result = await Production.findByIdAndUpdate(id, req.body, {new: true});
//     if (!result) {
//         throw HttpError(404, "Not found");
//     }
//     res.json(result);
// }

// const updateCheked = async (req, res) => {
//     const { id } = req.params;
//     const result = await Production.findByIdAndUpdate(id, req.body, {new: true});
//     if (!result) {
//         throw HttpError(404, "Not found");
//     }
//     res.json(result);
// }

const deleteById = async (req, res) => {
	try {
		const {id} = req.params;
		const result = await feedback.findByIdAndRemove(id);
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.json({
			message: "Delete success"
		})
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				`❌ Помилка (Backend. controllers/feedback/deleteById): ${e.message}\n\n`
			);
		}
		console.error(e);
		throw e;
	}
}

// const getAll = async (req, res) => {
//     const result = await wood.getAll();
//     res.json(result);
// }

// const add = async (req, res) => {
//     const result = await wood.add(req.body);
//     res.status(201).json(result);
// }

// const updateById = async (req, res) => {
//     const { id } = req.params;
//     const result = await wood.updateById(id, req.body);
//     if (!result) {
//         throw HttpError(404, "Not found");
//     }
//     res.json(result);
// }

// const deleteById = async (req, res) => {
//     const { id } = req.params;
//     const result = await wood.deleteById(id);
//     if (!result) {
//         throw HttpError(404, "Not found");
//     }
//     // res.status(204).send()
//     res.json({
//         message: "Delete success"
//     })
// }

module.exports = {
	getAll: ctrlWrapper(getAll),
	// getById: ctrlWrapper(getById),
	add: ctrlWrapper(add),
	// updateById: ctrlWrapper(updateById),
	// updateCheked: ctrlWrapper(updateCheked),
	deleteById: ctrlWrapper(deleteById),
}