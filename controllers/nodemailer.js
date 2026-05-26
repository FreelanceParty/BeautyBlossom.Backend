const {ctrlWrapper} = require("../helpers");
const fs = require("fs");
const path = require("path");

const mailer = require("./mailer");

const sendTelegramMessage = require("../helpers/telegram");

const {escapeHtml, wrapWithBrandedLayout, getBrandedLogoAttachment} = require("../helpers/emailTemplate");

async function sendEmail(paths, req, res) {
	try {
		const {title, text, to, subject} = req.body;

		const imagesHtml = paths
			.map((image) => `<img src="cid:${escapeHtml(image.cid)}" style="max-width:100%;height:auto;border-radius:12px;border:1px solid #f3d7ea;" />`)
			.join("");

		const contentHtml = `
			<div style="font-size:14px;line-height:20px;color:#111827;white-space:pre-wrap;">${escapeHtml(text || "")}</div>
			${imagesHtml ? `
			<div style="height:14px;line-height:14px;">&nbsp;</div>
			<div style="text-align:center;">${imagesHtml}</div>
			` : ""}
		`;

		const html = wrapWithBrandedLayout({
			title: title || "Повідомлення",
			contentHtml,
			cta:   {url: "https://www.beautyblossom.com.ua/", label: "Перейти на сайт"},
		});

		let attachments;
		try {
			attachments = [await getBrandedLogoAttachment(), ...(paths || [])];
		} catch (e) {
			attachments = paths;
		}

		const result = await mailer({
			from: "beautyblossom@ukr.net",
			to,
			subject,
			html,
			attachments,
		});

		console.log("Email is sent:", result);
		deleteOldImages();

		return {message: "Email is sent, please check the inbox", success: true};
	} catch (error) {
		await sendTelegramMessage(
			"Backend. controllers/nodemailer/sendEmail",
			`Error: ${error.message}`
		);
		console.log("An error occurred:", error);
		return {
			message: "Error occurred while sending the email",
			success: false,
		};
	}
}

function deleteOldImages() {
	const directory = "/var/public/uploads";
	// const directory = "public/uploads";
	fs.readdir(directory, (err, files) => {
		if (err) {
			throw err;
		}

		for (const file of files) {
			fs.unlink(path.join(directory, file), (err) => {
				if (err) {
					throw err;
				}
				console.log(`Deleted file: ${file}`);
			});
		}
	});
}

module.exports = {
	sendEmail: ctrlWrapper(sendEmail),
};
