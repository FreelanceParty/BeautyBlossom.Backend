require("dotenv").config();

const mongoose = require("mongoose");

const {basket} = require("../models/basket");
const {Goods} = require("../models/goods");

const getDbUri = () => {
	const {APP_ENV, DB_HOST} = process.env;
	if (APP_ENV === "local") {
		return "mongodb://127.0.0.1:27017/beauty";
	}
	return DB_HOST;
};

const parseArgs = () => {
	const args = new Set(process.argv.slice(2));
	return {
		dryRun: args.has("--dry-run") || args.has("--dryRun"),
	};
};

// Removes basket items whose product no longer exists in the goods collection.
// Matching is done by basket.productId === goods.id.
const cleanupBaskets = async ({dryRun}) => {
	let scanned = 0;
	let removed = 0;
	let keptMissingId = 0;

	// Cache of existing product ids to avoid querying the DB for each item.
	const existingIds = new Set(
		(await Goods.distinct("id")).map((v) => Number(v)).filter((v) => Number.isFinite(v))
	);

	const cursor = basket.find({}, {productId: 1, name: 1, owner: 1}).sort({_id: 1}).cursor();

	for await (const doc of cursor) {
		scanned += 1;

		const productId = Number(doc.productId);
		if (!Number.isFinite(productId)) {
			// No valid productId - keep it, just log.
			keptMissingId += 1;
			console.log(`[basket] SKIP_NO_PRODUCT_ID _id=${doc._id} productId=${JSON.stringify(doc.productId)}`);
			continue;
		}

		if (existingIds.has(productId)) {
			continue;
		}

		removed += 1;
		console.log(`[basket] REMOVE _id=${doc._id} productId=${productId} name=${JSON.stringify(doc.name)}`);

		if (!dryRun) {
			await basket.deleteOne({_id: doc._id});
		}
	}

	return {scanned, removed, keptMissingId};
};

const main = async () => {
	const {dryRun} = parseArgs();
	const uri = getDbUri();

	if (!uri) {
		throw new Error("Missing DB_HOST env var (or APP_ENV=local).");
	}

	console.log(`DB: ${uri}`);
	console.log(`Mode: ${dryRun ? "DRY_RUN" : "WRITE"}`);

	mongoose.set("strictQuery", true);
	await mongoose.connect(uri);

	try {
		const result = await cleanupBaskets({dryRun});
		console.log("Summary:");
		console.log(result);
	} finally {
		await mongoose.disconnect();
	}
};

main().catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
