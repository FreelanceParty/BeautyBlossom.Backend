require("dotenv").config();

const mongoose = require("mongoose");

const normalizePhone = require("../helpers/normalizePhone");
const {User} = require("../models/user");
const {orders: Orders} = require("../models/orders");

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
		stringifyInvalid: args.has("--stringify-invalid") || args.has("--stringifyInvalid"),
		limit: (() => {
			const idx = process.argv.findIndex((a) => a === "--limit");
			if (idx === -1) return null;
			const v = Number(process.argv[idx + 1]);
			return Number.isFinite(v) && v > 0 ? v : null;
		})(),
	};
};

const migrateCollection = async ({name, Model, limit, dryRun, stringifyInvalid}) => {
	let scanned = 0;
	let updated = 0;
	let skipped = 0;
	let invalid = 0;

	const cursor = Model.find(
		{},
		{number: 1}
	)
		.sort({_id: 1})
		.cursor();

	for await (const doc of cursor) {
		scanned += 1;
		if (limit && scanned > limit) {
			break;
		}

		const raw = doc.number;
		if (raw === undefined || raw === null || raw === "") {
			skipped += 1;
			continue;
		}

		let normalized;
		try {
			normalized = normalizePhone(raw);
		} catch (e) {
			invalid += 1;
			if (!stringifyInvalid) {
				console.log(`[${name}] INVALID _id=${doc._id} number=${JSON.stringify(raw)}`);
				continue;
			}

			const stringified = String(raw);
			if (typeof raw === "string" && raw === stringified) {
				skipped += 1;
				console.log(`[${name}] INVALID_SKIP _id=${doc._id} number=${JSON.stringify(raw)}`);
				continue;
			}

			updated += 1;
			console.log(`[${name}] INVALID_STRINGIFY _id=${doc._id} ${JSON.stringify(raw)} -> ${JSON.stringify(stringified)}`);
			if (!dryRun) {
				doc.number = stringified;
				await doc.save();
			}
			continue;
		}

		// If already normalized string and equal -> skip
		if (typeof raw === "string" && raw === normalized) {
			skipped += 1;
			continue;
		}

		updated += 1;
		console.log(`[${name}] UPDATE _id=${doc._id} ${JSON.stringify(raw)} -> ${normalized}`);

		if (!dryRun) {
			doc.number = normalized;
			await doc.save();
		}
	}

	return {name, scanned, updated, skipped, invalid};
};

const main = async () => {
	const {dryRun, limit, stringifyInvalid} = parseArgs();
	const uri = getDbUri();

	if (!uri) {
		throw new Error("Missing DB_HOST env var (or APP_ENV=local).");
	}

	console.log(`DB: ${uri}`);
	console.log(`Mode: ${dryRun ? "DRY_RUN" : "WRITE"}`);
	console.log(`Invalid handling: ${stringifyInvalid ? "STRINGIFY" : "SKIP"}`);
	if (limit) console.log(`Limit: ${limit}`);

	mongoose.set("strictQuery", true);
	await mongoose.connect(uri);

	try {
		const usersResult = await migrateCollection({
			name: "users",
			Model: User,
			limit,
			dryRun,
			stringifyInvalid,
		});
		const ordersResult = await migrateCollection({
			name: "orders",
			Model: Orders,
			limit,
			dryRun,
			stringifyInvalid,
		});

		console.log("Summary:");
		console.log(usersResult);
		console.log(ordersResult);
	} finally {
		await mongoose.disconnect();
	}
};

main().catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
