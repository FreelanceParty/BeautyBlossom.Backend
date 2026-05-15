// const wood = require("../WoodStorage/wood")

const {orders} = require('../models/orders')

const {HttpError, ctrlWrapper} = require("../helpers");

const sendTelegramMessage = require("../helpers/telegram");

const getAll = async (req, res) => {
	try { // const {_id: owner} = req.user; // щоб отримува тіоьки той хто створив
		// const {page = 1, limit = 10} = req.query;
		// req.query обєкт параметрів пошуку
		// const skip = (page - 1) * limit;
		const result = await orders.find();
		// const result = await inProgressDesk.find();
		// const result = await inProgressDesk.find({owner}, "-createdAt -updatedAt", {skip, limit}).populate("owner", "name email");

		// const result = await orders.find({owner}, "-createdAt -updatedAt").populate("owner", "name email");
		// -createdAt -updatedAt поля які не треба брати з бази
		// populate бере айді знаходить овенра і вставляє обєкт з його данними
		// 2 арг список полів які треба повернути
		// skip скілеи пропустити обєктів в базі, limit скільки повернути
		res.json(result);
	} catch (e) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/orders/getAll): ${e.message}\n\n`
		);
		console.error(e);
		throw e;
	}
}

const add = async (req, res) => {

	try {
		const owner = req.user ? req.user._id : null; // guest checkout дозволений
		const payload = {
			email: req.body.email,
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			number: req.body.number,
			city: req.body.city,
			warehouse: req.body.warehouse,
			paymentMethod: req.body.paymentMethod,
			comments: req.body.comments,
			amount: req.body.amount,
			deliveryMethod: req.body.deliveryMethod,
			status: req.body.status,
			address: req.body.address,
			building: req.body.building,
			apartment: req.body.apartment,
			isOptUser: req.body.isOptUser,
			orderNumber: req.body.orderNumber,
			orderedItems: req.body.orderedItems,
		};
		if (owner) payload.owner = owner;

		const result = await orders.create(payload);
		//  const result = await Wood.create({...req.body});

		res.status(201).json(result);
	} catch (e) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/orders/add): ${e.message}\n\n`
		);
		console.error(e);
		throw e;
	}
}

const getAllbyUser = async (req, res) => {
	try {
		const {user} = req; // Припустимо, що ви отримуєте інформацію про користувача з middleware
		const userId = user._id.toString().trim();
		const userOrders = await orders.find({owner: userId});

		res.json(userOrders);
	} catch (e) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/orders/getAllbyUser): ${e.message}\n\n`
		);
		console.error(e);
		throw e;
	}
};

const getById = async (req, res) => {
	try {
		const {id} = req.params;
		// const result = await Book.findOne({_id: id})
		const result = await orders.findById(id);
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.json(result);
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				`❌ Помилка (Backend. controllers/orders/getById): ${e.message}\n\n`
			);
		}
		console.error(e);
		throw e;
	}
}

// const add = async (req, res) => {

//     const { _id: owner } = req.user;
// console.log("йобаний юзер", req.user);

//     const result = await orders.create({ ...req.body, owner });
//     //  const result = await Wood.create({...req.body});

//     res.status(201).json(result);

// }

const updateById = async (req, res) => {
	try {
		const {id} = req.params;
		const result = await orders.findByIdAndUpdate(id, req.body, {new: true});
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.json(result);
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				`❌ Помилка (Backend. controllers/orders/updateById): ${e.message}\n\n`
			);
		}
		console.error(e);
		throw e;
	}
}

// const updateById = async (req, res) => {
//   const { id } = req.params;
//   const { amount } = req.body;

//     const currentItem = await orders.findById(id);

//     if (!currentItem) {
//       throw HttpError(404, "Not found");
//     }

//     currentItem.amount += parseInt(amount);
//     await currentItem.save();

//     res.json(currentItem);

// };

const updateChecked = async (req, res) => {
	try {
		const {id} = req.params;
		const {productId, isChecked} = req.body;
		const order = await orders.findById(id);
		if (!order) {
			throw HttpError(404, "Not found");
		}
		const itemToUpdate = order.orderedItems.find(item =>
			item.productId.toString() === productId
		);
		if (!itemToUpdate) {
			throw HttpError(404, "Not found");
		}
		itemToUpdate.isChecked = isChecked;
		order.markModified('orderedItems');
		await order.save();
		res.json(order);
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				`❌ Помилка (Backend. controllers/orders/updateChecked): ${e.message}\n\n`
			);
		}
		console.error(e);
		throw e;
	}
}

const updateStatus = async (req, res) => {
	try {
		const {id} = req.params;
		const {status} = req.body;

		if (status === undefined) {
			throw HttpError(400, "Missing required field: status");
		}

		const result = await orders.findByIdAndUpdate(
			id,
			{status},
			{new: true, runValidators: true}
		);

		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.json(result);
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(`❌ Помилка (Backend. controllers/orders/updateStatus): ${e.message}\n\n`);
		}
		console.error(e);
		throw e;
	}
}

const deleteById = async (req, res) => {
	try {
		const {id} = req.params;
		const result = await orders.findByIdAndRemove(id);
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.json({
			message: "Delete success"
		})
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				`❌ Помилка (Backend. controllers/orders/deleteById): ${e.message}\n\n`
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
	getAllbyUser:  ctrlWrapper(getAllbyUser),
	getAll:        ctrlWrapper(getAll),
	getById:       ctrlWrapper(getById),
	add:           ctrlWrapper(add),
	updateById:    ctrlWrapper(updateById),
	updateChecked: ctrlWrapper(updateChecked),
	updateStatus:  ctrlWrapper(updateStatus),
	deleteById:    ctrlWrapper(deleteById),
}