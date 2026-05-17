const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildOrdersFilter = (query, baseFilter = {}) => {
	const filter = {...baseFilter};

	if (query.status !== undefined && String(query.status).trim() !== "") {
		filter.status = String(query.status).trim();
	}

	const createdAt = {};
	if (query.dateFrom !== undefined && String(query.dateFrom).trim() !== "") {
		const d = new Date(String(query.dateFrom));
		if (!Number.isNaN(d.getTime())) {
			createdAt.$gte = d;
		}
	}
	if (query.dateTo !== undefined && String(query.dateTo).trim() !== "") {
		const d = new Date(String(query.dateTo));
		if (!Number.isNaN(d.getTime())) {
			createdAt.$lte = d;
		}
	}
	if (Object.keys(createdAt).length) {
		filter.createdAt = createdAt;
	}

	const or = [];
	if (query.email !== undefined && String(query.email).trim() !== "") {
		or.push({email: {$regex: escapeRegExp(String(query.email).trim()), $options: "i"}});
	}
	if (query.firstName !== undefined && String(query.firstName).trim() !== "") {
		or.push({firstName: {$regex: escapeRegExp(String(query.firstName).trim()), $options: "i"}});
	}
	if (query.lastName !== undefined && String(query.lastName).trim() !== "") {
		or.push({lastName: {$regex: escapeRegExp(String(query.lastName).trim()), $options: "i"}});
	}
	if (query.name !== undefined && String(query.name).trim() !== "") {
		const n = escapeRegExp(String(query.name).trim());
		or.push({firstName: {$regex: n, $options: "i"}});
		or.push({lastName: {$regex: n, $options: "i"}});
	}
	if (query.orderNumber !== undefined && String(query.orderNumber).trim() !== "") {
		or.push({orderNumber: {$regex: escapeRegExp(String(query.orderNumber).trim()), $options: "i"}});
	}
	if (query.q !== undefined && String(query.q).trim() !== "") {
		const q = escapeRegExp(String(query.q).trim());
		or.push({email: {$regex: q, $options: "i"}});
		or.push({firstName: {$regex: q, $options: "i"}});
		or.push({lastName: {$regex: q, $options: "i"}});
		or.push({orderNumber: {$regex: q, $options: "i"}});
	}

	if (or.length) {
		filter.$or = or;
	}

	return filter;
};

module.exports = {
	buildOrdersFilter,
};
