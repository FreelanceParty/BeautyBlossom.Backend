const crypto = require("crypto");
const path = require("path");

const parseArgs = () => {
	const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
		const [key, value] = arg.replace(/^--/, "").split("=");
		return [key, value ?? true];
	}));
	return {
		env:     args.env,
		clean:   Boolean(args.clean),
		force:   Boolean(args.force),
		users:   Number(args.users ?? 40),
		orders:  Number(args.orders ?? 200),
		reviews: Number(args.reviews ?? 150),
		baskets: Number(args.baskets ?? 60),
		feedback: Number(args.feedback ?? 15),
	};
};

const options = parseArgs();
require("dotenv").config(options.env ? {path: path.resolve(options.env)} : undefined);

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const {User} = require("../models/user");
const {orders: Order} = require("../models/orders");
const {productReviews: ProductReview} = require("../models/productReview");
const {basket: Basket} = require("../models/basket");
const {feedback: Feedback} = require("../models/feedback");
const {Goods} = require("../models/goods");
const {Brand} = require("../models/brand");
const {filters: Filter} = require("../models/filter");
const {
	SEED_EMAIL_REGEX,
	createRandom,
	buildUser,
	buildOrder,
	buildReview,
	buildBasketItem,
	buildFeedback,
} = require("./seed/factories");

const ALLOWED_ENVS = ["local", "staging"];
const RANDOM_SEED = 20261105;
const FIXED_ACCOUNTS = [
	{name: "admin", type: "retail", isAdmin: true},
	{name: "retail", type: "retail"},
	{name: "opt", type: "opt"},
	{name: "drop", type: "drop"},
];

const getDbUri = () => {
	const {APP_ENV, DB_HOST} = process.env;
	return APP_ENV === "local" ? "mongodb://127.0.0.1:27017/beauty" : DB_HOST;
};

const fail = (message) => {
	throw new Error(message);
};

const assertSafeTarget = async ({force}) => {
	const {APP_ENV} = process.env;
	if (!ALLOWED_ENVS.includes(APP_ENV)) {
		fail(`APP_ENV=${APP_ENV || "(порожньо)"}: seed дозволено лише для ${ALLOWED_ENVS.join(", ")}`);
	}
	const realUsers = await User.countDocuments({email: {$not: SEED_EMAIL_REGEX}});
	if (realUsers > 0 && !force) {
		fail(`У базі є ${realUsers} не тестових користувачів, схоже на реальні дані. Перевір DB_HOST. Якщо база точно тестова, запусти з --force`);
	}
};

const removeSeedData = async () => {
	const seedUsers = await User.find({email: SEED_EMAIL_REGEX}).select("_id").lean();
	const ownerIds = seedUsers.map((user) => user._id);
	const seedReviews = await ProductReview.find({email: SEED_EMAIL_REGEX}).select("productId").lean();

	const removed = {
		orders:   (await Order.deleteMany({email: SEED_EMAIL_REGEX})).deletedCount,
		reviews:  (await ProductReview.deleteMany({email: SEED_EMAIL_REGEX})).deletedCount,
		baskets:  (await Basket.deleteMany({owner: {$in: ownerIds}})).deletedCount,
		feedback: (await Feedback.deleteMany({owner: {$in: ownerIds}})).deletedCount,
		users:    (await User.deleteMany({email: SEED_EMAIL_REGEX})).deletedCount,
	};
	await refreshReviewStats([...new Set(seedReviews.map((review) => review.productId))]);
	return removed;
};

const refreshReviewStats = async (productIds) => {
	if (!productIds.length) return;
	const stats = await ProductReview.aggregate([
		{$match: {productId: {$in: productIds}}},
		{$group: {_id: "$productId", count: {$sum: 1}, avg: {$avg: "$rate"}}},
	]);
	const byId = new Map(stats.map((stat) => [stat._id, stat]));
	await Goods.bulkWrite(productIds.map((id) => {
		const stat = byId.get(id);
		return {
			updateOne: {
				filter: {id},
				update: {$set: {
					reviewsCount: stat?.count ?? 0,
					reviewsAvg:   stat ? Math.round(stat.avg * 10) / 10 : 0,
				}},
			},
		};
	}));
};

const seed = async (counts) => {
	const products = await Goods.find({id: {$exists: true, $ne: null}}).lean();
	if (!products.length) {
		fail("У базі немає товарів. Спершу завантаж товари, потім запусти seed");
	}
	const [brandsCount, filtersCount] = await Promise.all([Brand.countDocuments(), Filter.countDocuments()]);
	if (!brandsCount) console.warn("Увага: немає брендів, сторінки брендів будуть порожні");
	if (!filtersCount) console.warn("Увага: немає фільтрів, фільтри в каталозі будуть порожні");

	const random = createRandom(RANDOM_SEED);
	const password = process.env.SEED_PASSWORD || crypto.randomBytes(9).toString("base64url");
	const passwordHash = await bcrypt.hash(password, 10);

	const users = await User.insertMany([
		...FIXED_ACCOUNTS.map((account) => buildUser(random, {...account, passwordHash})),
		...Array.from({length: counts.users}, (_, i) => buildUser(random, {name: `user${i + 1}`, passwordHash})),
	]);
	const anyProduct = () => random.pick(products);
	const anyUser = () => random.pick(users);

	const createdOrders = await Order.insertMany(
		Array.from({length: counts.orders}, (_, index) => buildOrder(random, {user: anyUser(), products, index}))
	);
	const reviews = await ProductReview.insertMany(
		Array.from({length: counts.reviews}, () => buildReview(random, {user: anyUser(), product: anyProduct()}))
	);
	const baskets = await Basket.insertMany(
		Array.from({length: counts.baskets}, () => buildBasketItem(random, {user: anyUser(), product: anyProduct()}))
	);
	const feedback = await Feedback.insertMany(
		Array.from({length: counts.feedback}, () => buildFeedback(random, {user: anyUser()}))
	);
	await refreshReviewStats([...new Set(reviews.map((review) => review.productId))]);

	return {
		password,
		accounts: FIXED_ACCOUNTS.map(({name}) => `seed.${name}@example.com`),
		created:  {
			users:    users.length,
			orders:   createdOrders.length,
			reviews:  reviews.length,
			baskets:  baskets.length,
			feedback: feedback.length,
		},
		products: products.length,
	};
};

const main = async () => {
	const uri = getDbUri();
	if (!uri) fail("Не задано DB_HOST");
	await mongoose.connect(uri);
	const {host, name} = mongoose.connection;
	console.log(`База: ${host}/${name} (APP_ENV=${process.env.APP_ENV})`);

	await assertSafeTarget(options);
	console.log("Видалено попередні тестові дані:", await removeSeedData());
	if (options.clean) return;

	const result = await seed(options);
	console.log(`Створено на основі ${result.products} товарів:`, result.created);
	console.log("Тестові акаунти:", result.accounts.join(", "));
	console.log(`Пароль: ${result.password}`);
};

main()
	.catch((error) => {
		console.error(`Помилка: ${error.message}`);
		process.exitCode = 1;
	})
	.finally(() => mongoose.disconnect());
