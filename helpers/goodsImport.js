const XLSX = require("xlsx");

const DISPLAY_CAP = 1000;

const MATCH_KEY = "id";

const FIELD_TYPES = {
	id:                "number",
	name:              "string",
	article:           "string",
	code:              "number",
	amount:            "number",
	description:       "string",
	priceOPT:          "number",
	priceOldOPT:       "number",
	price:             "number",
	priceOld:          "number",
	priceDrop:         "number",
	priceOldDrop:      "number",
	brand:             "string",
	images:            "string",
	new:               "boolean",
	sale:              "boolean",
	category:          "string",
	subCategory:       "string",
	subSubCategory:    "string",
	country:           "string",
	compound:          "string",
	filterTagIds:      "string",
	usageInstructions: "string",
};

const COMPARABLE_FIELDS = Object.keys(FIELD_TYPES).filter((f) => f !== MATCH_KEY);

const normString = (value) => {
	if (value === null || value === undefined) {
		return "";
	}
	return String(value).trim();
};

const normNumber = (value) => {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const n = Number(String(value).trim().replace(",", "."));
	if (!Number.isFinite(n)) {
		return null;
	}
	return Math.round((n + Number.EPSILON) * 100) / 100;
};

const normBoolean = (value) => {
	if (typeof value === "boolean") {
		return value;
	}
	const v = String(value ?? "").trim().toLowerCase();
	if (["1", "true", "yes", "y", "так", "истина"].includes(v)) {
		return true;
	}
	return false;
};

const normalizeField = (field, value) => {
	switch (FIELD_TYPES[field]) {
		case "number":
			return normNumber(value);
		case "boolean":
			return normBoolean(value);
		default:
			return normString(value);
	}
};

const isEqual = (a, b) => {
	if (a === null && b === null) {
		return true;
	}
	return a === b;
};

const displayValue = (field, value) => {
	if (FIELD_TYPES[field] === "number") {
		return value === null ? "" : value;
	}
	return value;
};

const parseWorkbook = (buffer) => {
	const wb = XLSX.read(buffer, {type: "buffer"});
	const sheetName = wb.SheetNames[0];
	if (!sheetName) {
		return {columns: [], rows: []};
	}
	const ws = wb.Sheets[sheetName];
	const matrix = XLSX.utils.sheet_to_json(ws, {
		header:    1,
		defval:    null,
		blankrows: false,
		raw:       true,
	});
	if (!matrix.length) {
		return {columns: [], rows: []};
	}

	const header = matrix[0].map((h) => normString(h));
	const rows = [];
	for (let i = 1; i < matrix.length; i += 1) {
		const arr = matrix[i] || [];
		const obj = {};
		let hasValue = false;
		header.forEach((key, colIdx) => {
			if (!key) {
				return;
			}
			const cell = arr[colIdx];
			obj[key] = cell;
			if (cell !== null && cell !== undefined && String(cell).trim() !== "") {
				hasValue = true;
			}
		});
		if (hasValue) {
			rows.push({__rowNumber: i + 1, data: obj});
		}
	}

	return {columns: header.filter(Boolean), rows};
};

const rowToProduct = (rowData, presentFields) => {
	const product = {};
	for (const field of presentFields) {
		product[field] = normalizeField(field, rowData[field]);
	}
	return product;
};

/**
 * @param {Buffer} buffer
 * @param {Array}  dbGoods
 * @returns {Object}
 */
const buildImportReport = (buffer, dbGoods) => {
	const {columns, rows} = parseWorkbook(buffer);

	if (!columns.includes(MATCH_KEY)) {
		const err = new Error(
			`У файлі відсутня обов'язкова колонка «${MATCH_KEY}». Знайдені колонки: ${columns.join(", ") || "—"}`
		);
		err.status = 400;
		throw err;
	}

	const presentFields = COMPARABLE_FIELDS.filter((f) => columns.includes(f));

	const dbById = new Map();
	for (const doc of dbGoods) {
		if (doc[MATCH_KEY] !== null && doc[MATCH_KEY] !== undefined) {
			dbById.set(Number(doc[MATCH_KEY]), doc);
		}
	}

	const added = [];
	const updated = [];
	const errors = [];
	let unchanged = 0;

	const seenIds = new Set();

	for (const {__rowNumber, data} of rows) {
		const idValue = normNumber(data[MATCH_KEY]);
		if (idValue === null) {
			errors.push({
				row:     __rowNumber,
				message: `Порожній або нечисловий ${MATCH_KEY}`,
			});
			continue;
		}
		if (seenIds.has(idValue)) {
			errors.push({
				row:     __rowNumber,
				message: `Дубль ${MATCH_KEY}=${idValue} у файлі (пропущено)`,
			});
			continue;
		}
		seenIds.add(idValue);

		const product = rowToProduct(data, presentFields);
		product[MATCH_KEY] = idValue;

		const existing = dbById.get(idValue);
		if (!existing) {
			added.push({
				id:    idValue,
				name:  product.name ?? "",
				brand: product.brand ?? "",
				price: displayValue("price", product.price),
				product,
			});
			continue;
		}

		const changes = [];
		for (const field of presentFields) {
			const nextVal = product[field];
			const prevVal = normalizeField(field, existing[field]);
			if (!isEqual(prevVal, nextVal)) {
				changes.push({
					field,
					from: displayValue(field, prevVal),
					to:   displayValue(field, nextVal),
				});
			}
		}

		if (changes.length === 0) {
			unchanged += 1;
		} else {
			updated.push({
				id:      idValue,
				name:    product.name ?? existing.name ?? "",
				brand:   product.brand ?? existing.brand ?? "",
				changes,
				product,
			});
		}
	}

	const deleted = [];
	for (const doc of dbGoods) {
		const dbId = doc[MATCH_KEY] === null || doc[MATCH_KEY] === undefined
			? null
			: Number(doc[MATCH_KEY]);
		if (dbId === null || !seenIds.has(dbId)) {
			deleted.push({
				id:    dbId,
				name:  doc.name ?? "",
				brand: doc.brand ?? "",
				price: doc.price ?? "",
				_id:   doc._id,
			});
		}
	}

	const summary = {
		totalInFile: rows.length,
		added:       added.length,
		updated:     updated.length,
		deleted:     deleted.length,
		unchanged,
		errors:      errors.length,
		matchKey:    MATCH_KEY,
		columns,
		usedFields:  presentFields,
	};

	return {summary, added, updated, deleted, errors};
};

const capReport = (report) => {
	const cap = (arr) => ({
		items:     arr.slice(0, DISPLAY_CAP),
		truncated: Math.max(0, arr.length - DISPLAY_CAP),
	});

	const addedCap = cap(report.added);
	const updatedCap = cap(report.updated);
	const deletedCap = cap(report.deleted);
	const errorsCap = cap(report.errors);

	return {
		summary: report.summary,
		added:   addedCap.items.map(({product, ...rest}) => rest),
		updated: updatedCap.items.map(({product, ...rest}) => rest),
		deleted: deletedCap.items.map(({_id, ...rest}) => rest),
		errors:  errorsCap.items,
		truncated: {
			added:   addedCap.truncated,
			updated: updatedCap.truncated,
			deleted: deletedCap.truncated,
			errors:  errorsCap.truncated,
		},
	};
};

module.exports = {
	parseWorkbook,
	buildImportReport,
	capReport,
	MATCH_KEY,
	COMPARABLE_FIELDS,
	FIELD_TYPES,
	displayValue,
};
