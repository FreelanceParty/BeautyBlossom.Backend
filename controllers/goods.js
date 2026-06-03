// const wood = require("../WoodStorage/wood")

const {Goods} = require("../models/goods");
const {Parser} = require("json2csv"); // Пакет для перетворення JSON в CSV
const {HttpError, ctrlWrapper} = require("../helpers");
const xml2js = require("xml2js");
const {transliterate} = require("../utils/transliterate");
const sendTelegramMessage = require("../helpers/telegram");
const {getGoodsIndex, toMeiliGoodsDoc} = require("../helpers/meili");

const parseBool = (value) => {
	if (value === undefined) {
		return undefined;
	}
	if (typeof value === "boolean") {
		return value;
	}
	const v = String(value).trim().toLowerCase();
	if (["1", "true", "yes", "y"].includes(v)) {
		return true;
	}
	if (["0", "false", "no", "n"].includes(v)) {
		return false;
	}
	return undefined;
};

const parsePositiveInt = (value, fallback) => {
	const n = parseInt(value, 10);
	if (Number.isFinite(n) && n > 0) {
		return n;
	}
	return fallback;
};

const getAll = async (req, res) => {
	try {
		const {
			      brand,
			      category,
			      search,
			      sort  = "default",
			      page  = 1,
			      limit = 3000,
		      } = req.query;

		const query = {};

		const normalize = (val) => val?.trim();

		if (search) {
			const raw = String(search || "").trim();
			if (raw) {
				const words = raw.split(/\s+/).filter(Boolean);
				const and = words.map((w) => {
					const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
					const rx = new RegExp(escaped, "i");
					const numeric = /^\d+$/.test(w);
					const numericValue = numeric ? Number(w) : null;
					return {
						$or: [
							{name: {$regex: rx}},
							{article: {$regex: rx}},
							...(numeric
								? [
									{code: numericValue},
									{
										$expr: {
											$regexMatch: {
												input:   {$toString: "$code"},
												regex:   escaped,
												options: "i",
											},
										},
									},
								]
								: []),
						],
					};
				});

				query.$and = (query.$and || []).concat(and);
			}
		}

		if (brand) {
			const decodedBrand = decodeURIComponent(brand);
			query.brand = {
				$regex: new RegExp(`^${decodedBrand.trim()}$`, "i"), // ← чутливість до регістру прибрана
			};
		}

		if (category) {
			const decoded = decodeURIComponent(category);
			const normalizedCategory = decoded.startsWith("/")
				? decoded
				: `/${decoded}`;

			// 🪄 Розбиваємо шлях по слешах і прибираємо пусті
			let parts = normalizedCategory
				.split("/")
				.filter(Boolean) // прибирає порожні сегменти
				.map((str) => transliterate(str.trim(), true));
			console.log(parts);

			// 🧠 Видаляємо "katehoriji", якщо вона є першою
			if (parts[0]) {
				parts = parts.slice(1);
			}

			if (parts[0]) {
				query.category = {
					$regex: new RegExp(`^${normalize(parts[0])}$`, "i"),
				};
			}
			if (parts[1]) {
				query.subCategory = {
					$regex: new RegExp(`^${normalize(parts[1])}$`, "i"),
				};
			}
			if (parts[2]) {
				query.subSubCategory = {
					$regex: new RegExp(`^${normalize(parts[2])}$`, "i"),
				};
			}
		}

		// ==== PAGINATION ====
		const skip = (parseInt(page) - 1) * parseInt(limit);

		// ==== SORTING ====
		let sortOptions = {};
		switch (sort) {
			case "nameABC":
				sortOptions = {name: 1};
				break;
			case "nameCBA":
				sortOptions = {name: -1};
				break;
			case "priceMin":
				sortOptions = {price: 1};
				break;
			case "priceMax":
				sortOptions = {price: -1};
				break;
			case "inStock":
				query.amount = {$gte: 1};
				break;
			default:
				sortOptions = {}; // no sorting
		}

		const result = await Goods.find(query)
			.sort(sortOptions)
			.skip(skip)
			.limit(parseInt(limit));

		const totalCount = await Goods.countDocuments(query);

		if (!result.length) {
			throw HttpError(404, "No goods found");
		}

		res.json({
			page:       parseInt(page),
			limit:      parseInt(limit),
			total:      totalCount,
			totalPages: Math.ceil(totalCount / limit),
			goods:      result,
		});
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				"Backend. controllers/goods/getAll",
				`Error: ${e.message}`
			);
		}
		console.error(e);
		throw e;
	}
};

const fetchPage = async (req, res) => {
	try {
		const {
			      page,
			      perPage,
			      limit,
			      sale,
			      new: isNew,
			      inStock,
			      onlyAvailable,
			      sort = "default",
		      } = req.query;

		const pageNumber = parsePositiveInt(page, 1);
		const perPageNumber = Math.min(
			parsePositiveInt(perPage ?? limit, 24),
			200
		);
		const skip = (pageNumber - 1) * perPageNumber;

		const query = {};

		const saleBool = parseBool(sale);
		if (saleBool !== undefined) {
			query.sale = saleBool;
		}

		const newBool = parseBool(isNew);
		if (newBool !== undefined) {
			query.new = newBool;
		}

		const onlyAvailableBool = parseBool(onlyAvailable);
		if (onlyAvailableBool === true) {
			query.amount = {$gte: 1};
		} else {
			const inStockBool = parseBool(inStock);
			if (inStockBool === true) {
				query.amount = {$gte: 1};
			}
			if (inStockBool === false) {
				query.amount = {$lte: 0};
			}
		}

		let sortOptions = {};
		switch (sort) {
			case "nameABC":
				sortOptions = {name: 1};
				break;
			case "nameCBA":
				sortOptions = {name: -1};
				break;
			case "priceMin":
				sortOptions = {price: 1};
				break;
			case "priceMax":
				sortOptions = {price: -1};
				break;
			case "newest":
				sortOptions = {createdAt: -1};
				break;
			default:
				sortOptions = {};
		}

		const goods = await Goods.find(query)
			.sort(sortOptions)
			.skip(skip)
			.limit(perPageNumber);

		const total = await Goods.countDocuments(query);

		return res.json({
			page:       pageNumber,
			per_page:   perPageNumber,
			total,
			totalPages: Math.ceil(total / perPageNumber),
			goods,
		});
	} catch (e) {
		await sendTelegramMessage(
			"Backend. controllers/goods/fetchPage",
			`Error: ${e.message}`
		);
		console.error(e);
		throw e;
	}
};

const getRecommended = async (req, res) => {
	try {
		const {excludeId, productId, limit, onlyAvailable} = req.query;
		const limitNumber = Math.min(parsePositiveInt(limit, 12), 60);
		const rawExclude = excludeId ?? productId;
		const exclude = rawExclude !== undefined ? Number(rawExclude) : undefined;
		const onlyAvailableBool = parseBool(onlyAvailable);

		const match = {
			...(onlyAvailableBool === false ? {} : {amount: {$gte: 1}}),
			$or:    [{new: true}, {sale: true}],
		};
		if (exclude !== undefined && !Number.isNaN(exclude)) {
			match.id = {$ne: exclude};
		}

		const goods = await Goods.aggregate([
			{$match: match},
			{$sample: {size: limitNumber}},
		]);

		return res.json({goods});
	} catch (e) {
		await sendTelegramMessage(
			"Backend. controllers/goods/getRecommended",
			`Error: ${e.message}`
		);
		console.error(e);
		throw e;
	}
};

const getNews = async (req, res) => {
	try {
		const {page = 1, limit = 32} = req.query;
		const skip = (+page - 1) * +limit;

		// 1. Загальна кількість товарів
		const totalItems = await Goods.countDocuments({new: true});

		// 2. Список товарів з пагінацією
		const products = await Goods.find({new: true}, "-createdAt -updatedAt", {
			skip,
			limit: +limit,
		});

		res.json({
			totalItems,
			totalPages:  Math.ceil(products.length / +limit),
			currentPage: +page,
			items:       products,
		});
	} catch (e) {
		await sendTelegramMessage(
			"Backend. controllers/goods/getNews",
			`Error: ${e.message}`
		);
		console.error(e);
		throw e;
	}
};

// const result = await Wood.find({owner}, "-createdAt -updatedAt", {skip, limit}).populate("owner", "name email");

// -createdAt -updatedAt поля які не треба брати з бази
// populate бере айді знаходить овенра і вставляє обєкт з його данними
// 2 арг список полів які треба повернути
// skip скілеи пропустити обєктів в базі, limit скільки повернути

const getById = async (req, res) => {
	try {
		const {id} = req.params;
		// const result = await Book.findOne({_id: id})
		const result = await Goods.findOne({id: id});
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.json(result);
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				"Backend. controllers/goods/getById",
				e.message
			);
		}
		console.error(e);
		throw e;
	}
};

const add = async (req, res) => {
	try {
		const {_id: owner} = req.user;
		const result = await Goods.create({...req.body, owner});
		try {
			const index = getGoodsIndex();
			if (index) {
				await index.addDocuments([toMeiliGoodsDoc(result)]);
			}
		} catch {
		}
		//  const result = await Wood.create({...req.body});
		res.status(201).json(result);
	} catch (e) {
		await sendTelegramMessage(
			"Backend. controllers/goods/add",
			e.message
		);
		console.error(e);
		throw e;
	}
};

const updateById = async (req, res) => {
	try {
		const {id} = req.params;
		const result = await Goods.findByIdAndUpdate(id, req.body, {new: true});
		if (!result) {
			throw HttpError(404, "Not found");
		}
		try {
			const index = getGoodsIndex();
			if (index) {
				await index.addDocuments([toMeiliGoodsDoc(result)]);
			}
		} catch {
		}
		res.json(result);
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				"Backend. controllers/goods/updateById",
				`Error: ${e.message}`
			);
		}
		console.error(e);
		throw e;
	}
};

const updateCheked = async (req, res) => {
	try {
		const {id} = req.params;
		const result = await Goods.findByIdAndUpdate(id, req.body, {new: true});
		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.json(result);
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				"Backend. controllers/goods/updateCheked",
				`Error: ${e.message}`
			);
		}
		console.error(e);
		throw e;
	}
};

const updateAmount = async (req, res) => {
	try {
		const {id} = req.params;
		const {amount} = req.body;

		if (amount === undefined) {
			throw HttpError(400, "Missing required field: amount");
		}

		const result = await Goods.findByIdAndUpdate(
			id,
			{amount},
			{new: true, runValidators: true}
		);

		if (!result) {
			throw HttpError(404, "Not found");
		}
		res.json(result);
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				"Backend. controllers/goods/updateAmount",
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
		const result = await Goods.findByIdAndRemove(id);
		if (!result) {
			throw HttpError(404, "Not found");
		}
		try {
			const index = getGoodsIndex();
			if (index) {
				await index.deleteDocument(result._id.toString());
			}
		} catch {
		}
		res.json({
			message: "Delete success",
		});
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				"Backend. controllers/goods/deleteById",
				`Error: ${e.message}`
			);
		}
		console.error(e);
		throw e;
	}
};

const search = async (req, res) => {
	try {
		const {q = "", limit = 40} = req.query;
		const query = String(q || "").trim();
		if (!query) {
			return res.json({hits: [], query});
		}

		const index = getGoodsIndex();
		if (index) {
			const result = await index.search(query, {
				limit: Math.min(parseInt(limit) || 40, 200),
			});
			return res.json(result);
		}

		const words = query.split(/\s+/).filter(Boolean);
		const and = words.map((w) => ({name: {$regex: w, $options: "i"}}));
		const goods = await Goods.find({$and: and}).limit(
			Math.min(parseInt(limit) || 40, 200)
		);
		res.json({hits: goods, query});
	} catch (e) {
		await sendTelegramMessage(
			"Backend. controllers/goods/search",
			`Error: ${e.message}`
		);
		console.error(e);
		throw e;
	}
};
const getCSV = async (req, res) => {
	try {
		const goods = await Goods.find(); // Отримати всі товари
		if (!goods.length) {
			return res.status(404).send("No goods found");
		}

		// Додаємо властивість 'link', 'availability' та 'condition' до кожного товару
		const updatedGoods = goods.map((item) => ({
			...item.toObject(), // Перетворюємо товар на звичайний об'єкт
			link:         `https://www.beautyblossom.com.ua/products/${item.id}`, // Використовуємо 'id'
			id:           item._id,
			title:        item.name,
			availability: item.amount > 0 ? "in stock" : "out of stock",
			condition:    "new",
			image_link:   item.images,
		}));

		// Визначаємо поля, які мають бути у CSV-файлі
		const fields = [
			"title",
			"condition",
			"id",
			"name",
			"article",
			"code",
			"amount",
			"description",
			"priceOPT",
			"price",
			"link",
			"brand",
			"image_link",
			"country",
			"new",
			"sale",
			"category",
			"subCategory",
			"subSubCategory",
			"availability",
		];
		const json2csvParser = new Parser({fields});
		const csv = json2csvParser.parse(updatedGoods); // Перетворюємо дані у CSV

		res.header("Content-Type", "text/csv");
		res.attachment("products.csv");
		res.status(200).send(csv); // Відправляємо CSV-файл
	} catch (e) {
		await sendTelegramMessage(
			"Backend. controllers/goods/getCSV",
			`Error: ${e.message}`
		);
		console.error(e);
		return res.status(500).send("Error generating CSV");
	}
};

// Функція генерації XML

const getXML = async (req, res) => {
	try {
		const goods = await Goods.find();
		if (!goods.length) {
			return res.status(404).send("No goods found");
		}

		const updatedGoods = goods.map((item) => {
			const xmlItem = {
				"g:id":           item._id ? String(item._id) : "N/A",
				"g:title":        item.name || "No title",
				"g:description":  item.description || "No description available",
				"g:link":         `https://www.beautyblossom.com.ua/products/${item.id}`,
				"g:image_link":   item.images || "",
				"g:condition":    "new",
				"g:availability": item.amount > 0 ? "in stock" : "out of stock",
				"g:price":        `${item.price}.00 UAH`,
				"g:brand":        item.brand || "Unknown",
				"g:mpn":          item.article || "",
				"g:shipping":     {
					"g:country": "UA",
					"g:service": "Standard",
					"g:price":   "0.00 UAH",
				},
			};

			// 🟥 Ось додавання <g:sale_price>
			if (item.sale === true) {
				xmlItem["g:sale_price"] = `${item.priceOPT || item.price} UAH`;
			}

			return xmlItem;
		});

		const feed = {
			rss: {
				$:       {"xmlns:g": "http://base.google.com/ns/1.0", version: "2.0"},
				channel: {
					title:       "Beauty Blossom - Online Store",
					link:        "https://www.beautyblossom.com.ua",
					description: "Google Shopping XML Feed",
					item:        updatedGoods,
				},
			},
		};

		const builder = new xml2js.Builder({
			headless: true,
			xmldec:   {version: "1.0", encoding: "UTF-8"},
		});
		const xml = builder.buildObject(feed);

		res.setHeader("Content-Type", "application/xml");
		res.setHeader(
			"Cache-Control",
			"no-store, no-cache, must-revalidate, max-age=0"
		);
		res.setHeader("Pragma", "no-cache");
		res.setHeader("Expires", "0");

		res.status(200).send(xml);
	} catch (e) {
		if (e.code !== 404) {
			await sendTelegramMessage(
				"Backend. controllers/goods/getXML",
				`Error: ${e.message}`
			);
		}
		console.error(e);
		return res.status(500).send("Error generating XML");
	}
};

const findByBrandName = async (req, res) => {
	try {
		const {brandName} = req.params;
		const result = await Goods.find({
			brand: {$regex: brandName, $options: "i"}
		});
		res.json(result);
	} catch (e) {
		await sendTelegramMessage(
			"Backend. controllers/goods/findByBrandName",
			`Error: ${e.message}`
		);
		console.error(e);
		throw e;
	}
};

const findByCategory = async (req, res) => {
	try {
		const {category} = req.params;
		const regex = new RegExp(category, "i");
		const result = await Goods.find({
			$or: [
				{category: regex},
				{subCategory: regex},
				{subSubCategory: regex},
			],
		});
		res.json(result);
	} catch (e) {
		await sendTelegramMessage(
			"Backend. controllers/goods/findByCategory",
			`Error: ${e.message}`
		);
		console.error(e);
		throw e;
	}
};

module.exports = {
	getAll:          ctrlWrapper(getAll),
	fetchPage:       ctrlWrapper(fetchPage),
	getRecommended:  ctrlWrapper(getRecommended),
	getById:         ctrlWrapper(getById),
	search:          ctrlWrapper(search),
	add:             ctrlWrapper(add),
	updateById:      ctrlWrapper(updateById),
	updateCheked:    ctrlWrapper(updateCheked),
	updateAmount:    ctrlWrapper(updateAmount),
	deleteById:      ctrlWrapper(deleteById),
	getCSV:          ctrlWrapper(getCSV),
	getXML:          ctrlWrapper(getXML),
	getNews:         ctrlWrapper(getNews),
	findByBrandName: ctrlWrapper(findByBrandName),
	findByCategory:  ctrlWrapper(findByCategory),
};
