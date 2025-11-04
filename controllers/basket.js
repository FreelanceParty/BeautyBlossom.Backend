// const wood = require("../WoodStorage/wood")

const {basket} = require("../models/basket");
const {User} = require("../models/user");

const cron = require("node-cron");

const {HttpError, ctrlWrapper} = require("../helpers");

const sendTelegramMessage = require("../helpers/telegram");

const getAll = async (req, res) => {
	try {
		const {_id: owner} = req.user; // щоб отримува тіоьки той хто створив
		// const {page = 1, limit = 10} = req.query;
		// req.query обєкт параметрів пошуку
		// const skip = (page - 1) * limit;

		// const result = await inProgressDesk.find();
		// const result = await inProgressDesk.find({owner}, "-createdAt -updatedAt", {skip, limit}).populate("owner", "name email");

		const result = await basket
			.find({owner}, "-createdAt -updatedAt")
			.populate("owner", "name email");
		// -createdAt -updatedAt поля які не треба брати з бази
		// populate бере айді знаходить овенра і вставляє обєкт з його данними
		// 2 арг список полів які треба повернути
		// skip скілеи пропустити обєктів в базі, limit скільки повернути
		res.json(result);
	} catch (e) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/basket/getAll): ${e.message}\n\n`
		);
		console.error(e);
		throw e;
	}
};

const getById = async (req, res) => {
	try {
		const {id} = req.params;
		// const result = await Book.findOne({_id: id})
		const result = await basket.findById(id);
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.json(result);
	} catch (e) {
		if (e.code !== 404) {
			await sendTelegramMessage(
				`❌ Помилка (Backend. controllers/basket/getById): ${e.message}\n\n`
			);
		}
		console.error(e);
		throw e;
	}
};

const add = async (req, res) => {
	try {
		const {_id: owner} = req.user;
		const user = await User.findById(owner);

		if (!user.basketCreatedAt) {
			user.basketCreatedAt = new Date();
			await user.save();
		}

		const result = await basket.create({...req.body, owner});
		res.status(201).json(result);
	} catch (e) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/basket/add): ${e.message}\n\n`
		);
		console.error(e);
		throw e;
	}
};

const updateById = async (req, res) => {
	try {
		const {id} = req.params;
		const {quantity} = req.body;

		const currentItem = await basket.findById(id);

		if (!currentItem) {
			throw HttpError(404, "Not found");
		}
		currentItem.quantity = parseInt(quantity);
		await currentItem.save();

		res.json(currentItem);
	} catch (e) {
		if (e.code !== 404) {
			await sendTelegramMessage(
				`❌ Помилка (Backend. controllers/basket/updateById): ${e.message}\n\n`
			);
		}
		console.error(e);
		throw e;
	}
};

const updateCheked = async (req, res) => {
	try {
		const {id} = req.params;
		const result = await basket.findByIdAndUpdate(id, req.body, {new: true});
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.json(result);
	} catch (e) {
		if (e.code !== 404) {
			await sendTelegramMessage(
				`❌ Помилка (Backend. controllers/basket/updateCheked): ${e.message}\n\n`
			);
		}
		console.error(e);
		throw e;
	}
};

const deleteById = async (req, res) => {
	try {
		const {id} = req.params;
		const result = await basket.findByIdAndRemove(id);
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.json({
			message: "Delete success",
		});
	} catch (e) {
		if (e.code !== 404) {
			await sendTelegramMessage(
				`❌ Помилка (Backend. controllers/basket/deleteById): ${e.message}\n\n`
			);
		}
		console.error(e);
		throw e;
	}
};

const deleteAllByOwner = async (req, res) => {
	try {
		const {_id: owner} = req.user;

		const result = await basket.deleteMany({owner});

		res.json({
			message:      "All items deleted successfully",
			deletedCount: result.deletedCount,
		});
	} catch (e) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/basket/deleteAllByOwner): ${e.message}\n\n`
		);
		console.error(e);
		throw e;
	}
};

cron.schedule("0 0 * * *", async () => {
	try {
		const now = new Date();

		const cutoffDate = new Date(now.getTime() - 11

			* 24 * 60 * 60 * 1000);

		const result = await basket.deleteMany({createdAt: {$lt: cutoffDate}});
		console.log(`Deleted ${result.deletedCount} items from the basket.`);
	} catch (error) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/basket/cron.schedule): ${error.message}\n\n`
		);
		console.error("Error deleting expired basket items:", error);
	}
});

module.exports = {
	deleteAllByOwner: ctrlWrapper(deleteAllByOwner),
	getAll:           ctrlWrapper(getAll),
	getById:          ctrlWrapper(getById),
	add:              ctrlWrapper(add),
	updateById:       ctrlWrapper(updateById),
	updateCheked:     ctrlWrapper(updateCheked),
	deleteById:       ctrlWrapper(deleteById),
};
