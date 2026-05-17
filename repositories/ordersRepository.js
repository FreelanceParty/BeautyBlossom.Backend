const {orders} = require("../models/orders");

const count = (filter) => orders.countDocuments(filter);

const findPaginated = (filter, {skip, limit} = {}) => {
	return orders.find(filter).sort({createdAt: -1}).skip(skip).limit(limit);
};

const create = (payload) => orders.create(payload);

const findById = (id) => orders.findById(id);

const updateById = (id, payload) => orders.findByIdAndUpdate(id, payload, {new: true});

const updateStatusById = (id, status) => {
	return orders.findByIdAndUpdate(id, {status}, {new: true, runValidators: true});
};

const removeById = (id) => orders.findByIdAndRemove(id);

module.exports = {
	count,
	findPaginated,
	create,
	findById,
	updateById,
	updateStatusById,
	removeById,
};
