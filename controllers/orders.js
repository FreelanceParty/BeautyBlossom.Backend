// const wood = require("../WoodStorage/wood")

const {ctrlWrapper} = require("../helpers");

const sendTelegramMessage = require("../helpers/telegram");

const ordersService = require("../services/orders/ordersService");

const getAll = async (req, res) => {
	try {
		const {items, withMeta, meta, headers} = await ordersService.listOrders({
			query: req.query,
		});

		res.set(headers);

		if (withMeta) {
			res.json({items, meta});
			return;
		}

		res.json(items);
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
		const userId = req.user ? req.user._id : null; // guest checkout дозволений
		const result = await ordersService.createOrder({
			userId,
			body: req.body,
		});
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
		const {user} = req;
		const userId = user._id.toString().trim();

		const {items, withMeta, meta, headers} = await ordersService.listOrders({
			query:      req.query,
			baseFilter: {owner: userId},
		});

		res.set(headers);

		if (withMeta) {
			res.json({items, meta});
			return;
		}

		res.json(items);
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
		const result = await ordersService.getOrderById(id);
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
		const result = await ordersService.updateOrderById(id, req.body);
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
		const order = await ordersService.updateOrderItemChecked({id, productId, isChecked});
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
		const result = await ordersService.updateOrderStatus({id, status});
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
		await ordersService.deleteOrderById(id);
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