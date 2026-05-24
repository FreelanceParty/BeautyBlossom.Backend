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
			"Backend. controllers/orders/getAll",
			`Error: ${e.message}`
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
			"Backend. controllers/orders/add",
			`Error: ${e.message}`
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
			"Backend. controllers/orders/getAllbyUser",
			`Error: ${e.message}`
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
				"Backend. controllers/orders/getById",
				`Error: ${e.message}`
			);
		}
		console.error(e);
		throw e;
	}
}

const updateById = async (req, res) => {
	try {
		const {id} = req.params;
		const result = await ordersService.updateOrderById(id, req.body);
		res.json(result);
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				"Backend. controllers/orders/updateById",
				`Error: ${e.message}`
			);
		}
		console.error(e);
		throw e;
	}
}

const updateChecked = async (req, res) => {
	try {
		const {id} = req.params;
		const {productId, isChecked} = req.body;
		const order = await ordersService.updateOrderItemChecked({id, productId, isChecked});
		res.json(order);
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				"Backend. controllers/orders/updateChecked",
				`Error: ${e.message}`
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
			await sendTelegramMessage(
				"Backend. controllers/orders/updateStatus",
				`Error: ${e.message}`
			);
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
				"Backend. controllers/orders/deleteById",
				`Error: ${e.message}`
			);
		}
		console.error(e);
		throw e;
	}
}

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