const {HttpError} = require("../../helpers");

const ordersRepository = require("../../repositories/ordersRepository");
const workerEmailsRepository = require("../../repositories/workerEmailsRepository");
const {buildOrdersFilter} = require("./ordersFilterBuilder");

const mailer = require("../../controllers/mailer");
const sendTelegramMessage = require("../../helpers/telegram");

const {escapeHtml, wrapWithBrandedLayout, getBrandedLogoAttachment} = require("../../helpers/emailTemplate");

const sendOrderCreatedEmails = async (order) => {
	const workerEmails = await workerEmailsRepository.findActiveByEvent("order_created");
	const recipients = new Set(
		[order.email, ...workerEmails.map(({email}) => email)]
			.filter(Boolean)
			.map((e) => String(e).trim().toLowerCase())
	);

	const subject = `Нове замовлення №${order.orderNumber || order._id}`;
	const safe = escapeHtml;
	const items = order.orderedItems || [];
	const itemsText = items
		.map((i) => `- ${i.name} (${i.code}) x${i.quantity} = ${i.amount}`)
		.join("\n");

	const text =
		      `Нове замовлення\n` +
		      `Номер: ${order.orderNumber || order._id}\n` +
		      `Статус: ${order.status}\n` +
		      `Покупець: ${order.firstName} ${order.lastName}\n` +
		      `Телефон: ${order.number}\n` +
		      `Email: ${order.email}\n` +
		      `Доставка: ${order.deliveryMethod}\n` +
		      `Місто: ${order.city}\n` +
		      `${order.warehouse ? `Відділення: ${order.warehouse}\n` : ""}` +
		      `${order.address ? `Адреса: ${order.address}\n` : ""}` +
		      `${order.building ? `Будинок: ${order.building}\n` : ""}` +
		      `${order.apartment ? `Квартира: ${order.apartment}\n` : ""}` +
		      `${order.comments ? `Коментар: ${order.comments}\n` : ""}` +
		      `Сума: ${order.amount}\n\n` +
		      `Товари:\n${itemsText}`;

	const itemsRowsHtml = items
		.map((i) => {
			return (
				"<tr>" +
				`<td style=\"padding:12px 10px;border-top:1px solid #f0f0f0;vertical-align:top;\">` +
				`<div style=\"font-weight:600;color:#111827;\">${safe(i.name)}</div>` +
				`<div style=\"font-size:12px;color:#6b7280;margin-top:2px;\">Артикул: ${safe(i.code)}</div>` +
				"</td>" +
				`<td style=\"padding:12px 10px;border-top:1px solid #f0f0f0;text-align:center;white-space:nowrap;\">${safe(i.quantity)}</td>` +
				`<td style=\"padding:12px 10px;border-top:1px solid #f0f0f0;text-align:right;white-space:nowrap;font-weight:600;\">${safe(i.amount)}</td>` +
				"</tr>"
			);
		})
		.join("");

	const contentHtml = `
		<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
			<tr>
				<td style="padding:10px 12px;background:#fff7fb;border:1px solid #f3d7ea;border-radius:12px;">
					<div style="font-size:12px;color:#6b7280;">Покупець</div>
					<div style="font-size:14px;font-weight:600;color:#111827;margin-top:2px;">${safe(order.firstName)} ${safe(order.lastName)}</div>
					<div style="font-size:13px;color:#374151;margin-top:6px;">Телефон: <span style="font-weight:600;">${safe(order.number)}</span></div>
					<div style="font-size:13px;color:#374151;margin-top:2px;">Email: <span style="font-weight:600;">${safe(order.email)}</span></div>
				</td>
			</tr>
		</table>

		<div style="height:12px;line-height:12px;">&nbsp;</div>

		<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
			<tr>
				<td style="padding:10px 12px;background:#f8fafc;border:1px solid #eef2f7;border-radius:12px;">
					<div style="font-size:12px;color:#6b7280;">Доставка</div>
					<div style="font-size:13px;color:#111827;margin-top:4px;">Спосіб: <span style="font-weight:600;">${safe(order.deliveryMethod)}</span></div>
					<div style="font-size:13px;color:#111827;margin-top:2px;">Місто: <span style="font-weight:600;">${safe(order.city)}</span></div>
					${order.warehouse ? `<div style="font-size:13px;color:#111827;margin-top:2px;">Відділення: <span style="font-weight:600;">${safe(order.warehouse)}</span></div>` : ""}
					${order.address ? `<div style="font-size:13px;color:#111827;margin-top:2px;">Адреса: <span style="font-weight:600;">${safe(order.address)}</span></div>` : ""}
					${order.building ? `<div style="font-size:13px;color:#111827;margin-top:2px;">Будинок: <span style="font-weight:600;">${safe(order.building)}</span></div>` : ""}
					${order.apartment ? `<div style="font-size:13px;color:#111827;margin-top:2px;">Квартира: <span style="font-weight:600;">${safe(order.apartment)}</span></div>` : ""}
				</td>
			</tr>
		</table>

		${order.comments ? `
		<div style="height:12px;line-height:12px;">&nbsp;</div>
		<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
			<tr>
				<td style="padding:10px 12px;background:#ffffff;border:1px dashed #e5e7eb;border-radius:12px;">
					<div style="font-size:12px;color:#6b7280;">Коментар</div>
					<div style="font-size:13px;color:#111827;margin-top:4px;white-space:pre-wrap;">${safe(order.comments)}</div>
				</td>
			</tr>
		</table>
		` : ""}

		<div style="height:16px;line-height:16px;">&nbsp;</div>

		<div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:8px;">Товари</div>
		<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#ffffff;border:1px solid #eef2f7;border-radius:12px;overflow:hidden;font-family:Arial,sans-serif;">
			<tr>
				<th align="left" style="padding:12px 10px;background:#f9fafb;color:#6b7280;font-size:12px;font-weight:700;">Товар</th>
				<th align="center" style="padding:12px 10px;background:#f9fafb;color:#6b7280;font-size:12px;font-weight:700;">К-сть</th>
				<th align="right" style="padding:12px 10px;background:#f9fafb;color:#6b7280;font-size:12px;font-weight:700;">Сума</th>
			</tr>
			${itemsRowsHtml || `<tr><td colspan="3" style="padding:12px 10px;border-top:1px solid #f0f0f0;color:#6b7280;">Немає товарів</td></tr>`}
			<tr>
				<td colspan="2" style="padding:14px 10px;border-top:1px solid #f0f0f0;text-align:right;color:#111827;font-weight:700;">Разом:</td>
				<td style="padding:14px 10px;border-top:1px solid #f0f0f0;text-align:right;color:#111827;font-weight:800;white-space:nowrap;">${safe(order.amount)}</td>
			</tr>
		</table>
	`;

	const html = wrapWithBrandedLayout({
		title:    "Нове замовлення",
		subtitle: `№ ${order.orderNumber || order._id}`,
		contentHtml,
		cta:      {url: "https://beautyblossom.com.ua/", label: "Перейти на сайт"},
	});

	let attachments;
	try {
		attachments = [await getBrandedLogoAttachment()];
	} catch (e) {
		attachments = undefined;
	}

	await Promise.allSettled(
		Array.from(recipients).map((to) =>
			mailer({
				to,
				subject,
				text,
				html,
				attachments,
			})
		)
	);
};

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

	const order = await ordersRepository.create(payload);

	setImmediate(() => {
		sendOrderCreatedEmails(order).catch(async (e) => {
			await sendTelegramMessage(
				"Backend. services/orders/createOrder email",
				`Error: ${e.message}`
			);
		});
	});

	return order;
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
