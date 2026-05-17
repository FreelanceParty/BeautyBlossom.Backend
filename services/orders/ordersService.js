const {HttpError} = require("../../helpers");

const ordersRepository = require("../../repositories/ordersRepository");
const {buildOrdersFilter} = require("./ordersFilterBuilder");

const listOrders = async ({query, baseFilter = {}}) => {
	const page = Math.max(1, Number(query.page) || 1);
	const limit = Math.min(100, Math.max(1, Number(query.limit) || 16));
	const skip = (page - 1) * limit;
	const withMeta = String(query.withMeta || "").toLowerCase() === "true";

	const filter = buildOrdersFilter(query, baseFilter);

	const [total, items] = await Promise.all([
		ordersRepository.count(filter),
		ordersRepository.findPaginated(filter, {skip, limit}),
	]);

	const pages = Math.max(1, Math.ceil(total / limit));

	return {
		items,
		withMeta,
		meta:    {total, pages, page, limit},
		headers: {
			"X-Total-Count": String(total),
			"X-Total-Pages": String(pages),
			"X-Page":        String(page),
			"X-Limit":       String(limit),
		},
	};
};

const createOrder = async ({userId, body}) => {
	const payload = {
		email:          body.email,
		firstName:      body.firstName,
		lastName:       body.lastName,
		number:         body.number,
		city:           body.city,
		warehouse:      body.warehouse,
		paymentMethod:  body.paymentMethod,
		comments:       body.comments,
		amount:         body.amount,
		deliveryMethod: body.deliveryMethod,
		status:         body.status,
		address:        body.address,
		building:       body.building,
		apartment:      body.apartment,
		isOptUser:      body.isOptUser,
		orderNumber:    body.orderNumber,
		orderedItems:   body.orderedItems,
	};

	if (userId) {
		payload.owner = userId;
	}

	return ordersRepository.create(payload);
};

const getOrderById = async (id) => {
	const order = await ordersRepository.findById(id);
	if (!order) {
		throw HttpError(404, "Not found");
	}
	return order;
};

const updateOrderById = async (id, payload) => {
	const order = await ordersRepository.updateById(id, payload);
	if (!order) {
		throw HttpError(404, "Not found");
	}
	return order;
};

const updateOrderItemChecked = async ({id, productId, isChecked}) => {
	const order = await ordersRepository.findById(id);
	if (!order) {
		throw HttpError(404, "Not found");
	}

	const itemToUpdate = order.orderedItems.find(item => item.productId.toString() === productId);
	if (!itemToUpdate) {
		throw HttpError(404, "Not found");
	}

	itemToUpdate.isChecked = isChecked;
	order.markModified("orderedItems");
	await order.save();
	return order;
};

const updateOrderStatus = async ({id, status}) => {
	if (status === undefined) {
		throw HttpError(400, "Missing required field: status");
	}

	const order = await ordersRepository.updateStatusById(id, status);
	if (!order) {
		throw HttpError(404, "Not found");
	}
	return order;
};

const deleteOrderById = async (id) => {
	const order = await ordersRepository.removeById(id);
	if (!order) {
		throw HttpError(404, "Not found");
	}
	return order;
};

module.exports = {
	listOrders,
	createOrder,
	getOrderById,
	updateOrderById,
	updateOrderItemChecked,
	updateOrderStatus,
	deleteOrderById,
};
