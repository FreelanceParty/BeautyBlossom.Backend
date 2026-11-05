const SEED_EMAIL_PREFIX = "seed.";
const SEED_EMAIL_DOMAIN = "example.com";
const SEED_EMAIL_REGEX = /^seed\..*@example\.com$/;

const AVATAR_URL = "https://www.gravatar.com/avatar/00000000000000000000000000000000";
const HISTORY_DAYS = 180;
const DAY_MS = 24 * 60 * 60 * 1000;

const FIRST_NAMES = ["Олена", "Марія", "Ірина", "Наталія", "Тетяна", "Оксана", "Юлія", "Анна", "Катерина", "Вікторія", "Дарина", "Софія", "Андрій", "Олег", "Максим"];
const LAST_NAMES = ["Шевченко", "Коваленко", "Бондаренко", "Ткаченко", "Кравченко", "Олійник", "Шевчук", "Поліщук", "Бойко", "Мельник", "Савченко", "Руденко"];
const CITIES = ["Київ", "Львів", "Одеса", "Дніпро", "Харків", "Вінниця", "Полтава", "Чернігів", "Івано-Франківськ", "Тернопіль", "Луцьк", "Рівне"];
const STREETS = ["Шевченка", "Лесі Українки", "Соборна", "Незалежності", "Грушевського", "Садова", "Центральна"];
const REVIEW_TEXTS = [
	"Дуже задоволена, шкіра стала м'якшою вже за тиждень.",
	"Гарний засіб, приємна текстура і легкий аромат.",
	"Купую не вперше, якість стабільно хороша.",
	"Швидка доставка, товар оригінальний.",
	"Нормально, але очікувала трохи більшого ефекту.",
	"Підійшло моїй чутливій шкірі, подразнення немає.",
	"Економна витрата, вистачає надовго.",
	"Рекомендую, співвідношення ціни та якості чудове.",
];
const FEEDBACK_TEXTS = [
	"Зручний сайт, але хотілося б більше фільтрів.",
	"Дякую за швидку відправку замовлення.",
	"Додайте, будь ласка, більше брендів для волосся.",
	"Менеджер швидко відповів і допоміг з вибором.",
];
const ORDER_COMMENTS = ["", "", "", "Зателефонуйте перед відправкою", "Подарункове пакування, будь ласка"];
const ORDER_STATUSES = ["Новий", "Прийняте в роботу", "Збирається", "Зібрано", "Відправлено", "Відправлено", "Відправлено", "Відміна"];
const PAYMENT_METHODS = ["Післяплата", "Оплата за реквізитами"];
const USER_TYPES = ["retail", "retail", "retail", "opt", "drop"];

const createRandom = (seed) => {
	let state = seed >>> 0;
	const next = () => {
		state = (state + 0x6D2B79F5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	const int = (min, max) => min + Math.floor(next() * (max - min + 1));
	const pick = (items) => items[int(0, items.length - 1)];
	const pastDate = (days = HISTORY_DAYS) => new Date(Date.now() - next() * days * DAY_MS);
	return {next, int, pick, pastDate};
};

const seedEmail = (name) => `${SEED_EMAIL_PREFIX}${name}@${SEED_EMAIL_DOMAIN}`;

const buildPhone = (random) => `+38050${String(random.int(0, 9999999)).padStart(7, "0")}`;

const buildUser = (random, {name, type = random.pick(USER_TYPES), isAdmin = false, passwordHash}) => ({
	firstName:     random.pick(FIRST_NAMES),
	lastName:      random.pick(LAST_NAMES),
	email:         seedEmail(name),
	password:      passwordHash,
	city:          random.pick(CITIES),
	number:        buildPhone(random),
	optUser:       type === "opt",
	dropUser:      type === "drop",
	retailUser:    type === "retail",
	activeCabinet: type,
	isAdmin,
	avatarURL:     AVATAR_URL,
	verify:        true,
	createdAt:     random.pastDate(),
});

const priceForUser = (user, product) => {
	if (user.optUser) return product.priceOPT ?? product.price ?? 0;
	if (user.dropUser) return product.priceDrop ?? product.price ?? 0;
	return product.price ?? 0;
};

const buildOrderItem = (random, product) => ({
	productId: String(product.id),
	images:    product.images,
	code:      String(product.code ?? ""),
	amount:    product.amount ?? 0,
	name:      product.name,
	quantity:  random.int(1, 3),
	sale:      Boolean(product.sale),
});

const buildOrder = (random, {user, products, index}) => {
	const items = Array.from({length: random.int(1, 5)}, () => buildOrderItem(random, random.pick(products)));
	const total = items.reduce((sum, item) => sum + priceForUser(user, products.find((p) => String(p.id) === item.productId)) * item.quantity, 0);
	const isCourier = !user.dropUser && random.next() < 0.3;
	const deliveryMethod = user.dropUser ? "Дропшипінг" : isCourier ? "Доставка кур'єром" : "Доставка на відділення";
	return {
		owner:         String(user._id),
		isOptUser:     user.optUser,
		isDropUser:    user.dropUser,
		email:         user.email,
		firstName:     user.firstName,
		lastName:      user.lastName,
		number:        user.number,
		city:          user.city,
		...(isCourier
			? {address: `вул. ${random.pick(STREETS)}`, building: String(random.int(1, 120)), apartment: String(random.int(1, 200))}
			: {warehouse: `Відділення №${random.int(1, 150)}`}),
		paymentMethod: user.dropUser ? "Оплата за реквізитами" : random.pick(PAYMENT_METHODS),
		comments:      random.pick(ORDER_COMMENTS),
		amount:        total,
		deliveryMethod,
		status:        random.pick(ORDER_STATUSES),
		orderNumber:   `9${String(index).padStart(8, "0")}`,
		orderedItems:  items,
		createdAt:     random.pastDate(),
	};
};

const buildReview = (random, {user, product}) => ({
	productId: product.id,
	email:     user.email,
	firstName: user.firstName,
	rate:      random.pick([5, 5, 5, 4, 4, 3]),
	message:   random.pick(REVIEW_TEXTS),
	image:     null,
	createdAt: random.pastDate(),
});

const buildBasketItem = (random, {user, product}) => ({
	owner:          user._id,
	name:           product.name,
	article:        product.article,
	code:           product.code,
	productId:      product.id,
	amount:         product.amount,
	description:    product.description,
	priceOPT:       product.priceOPT,
	priceDrop:      product.priceDrop,
	quantity:       random.int(1, 3),
	price:          product.price,
	brand:          product.brand,
	images:         product.images,
	new:            Boolean(product.new),
	sale:           Boolean(product.sale),
	category:       product.category,
	subCategory:    product.subCategory,
	subSubCategory: product.subSubCategory,
});

const buildFeedback = (random, {user}) => ({
	feedbacks: random.pick(FEEDBACK_TEXTS),
	owner:     user._id,
	createdAt: random.pastDate(),
});

module.exports = {
	SEED_EMAIL_REGEX,
	createRandom,
	buildUser,
	buildOrder,
	buildReview,
	buildBasketItem,
	buildFeedback,
};
