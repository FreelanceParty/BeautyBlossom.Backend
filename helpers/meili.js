const {MeiliSearch} = require("meilisearch");

const getMeiliClient = () => {
	const host = process.env.MEILI_HOST;
	if (!host) return null;

	return new MeiliSearch({
		host,
		apiKey: process.env.MEILI_API_KEY,
	});
};

const getGoodsIndex = () => {
	const client = getMeiliClient();
	if (!client) return null;
	const indexName = process.env.MEILI_INDEX_GOODS || "goods";
	return client.index(indexName);
};

const toMeiliGoodsDoc = (doc) => {
	const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
	return {
		_id: obj._id?.toString(),
		id: obj.id,
		name: obj.name,
		brand: obj.brand,
		category: obj.category,
		subCategory: obj.subCategory,
		subSubCategory: obj.subSubCategory,
		description: obj.description,
		article: obj.article,
		code: obj.code,
		price: obj.price,
		priceOPT: obj.priceOPT,
		priceDrop: obj.priceDrop,
		amount: obj.amount,
		images: obj.images,
		country: obj.country,
		availability: obj.availability,
		new: obj.new,
		sale: obj.sale,
		filterTagIds: obj.filterTagIds,
	};
};

const ensureGoodsIndex = async () => {
	const client = getMeiliClient();
	if (!client) return;
	const indexName = process.env.MEILI_INDEX_GOODS || "goods";

	try {
		await client.getIndex(indexName);
	} catch {
		await client.createIndex(indexName, {primaryKey: "_id"});
	}

	const index = client.index(indexName);
	await index.updateSearchableAttributes([
		"name",
		"brand",
		"description",
		"article",
		"code",
		"category",
		"subCategory",
		"subSubCategory",
	]);
	await index.updateFilterableAttributes([
		"brand",
		"category",
		"subCategory",
		"subSubCategory",
		"sale",
		"new",
		"amount",
	]);
};

module.exports = {
	getMeiliClient,
	getGoodsIndex,
	toMeiliGoodsDoc,
	ensureGoodsIndex,
};
