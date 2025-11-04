const nodemailer = require("nodemailer");
const sendTelegramMessage = require("../helpers/telegram");
const {APP_ENV, EMAIL_HOST, EMAIL_PORT, EMAIL_USER} = process.env;

const transporter = nodemailer.createTransport({
	host:   EMAIL_HOST,
	port:   EMAIL_PORT,
	secure: true,
	auth:   {
		user: EMAIL_USER,
		pass: 'RuiaOnDF6RL9m9Gl',
	},
});

const mailer = async (message) => {
	try {
		if (APP_ENV === 'local') {
			return;
		}
		await transporter.sendMail({
			...message,
			from: EMAIL_USER,
		});
		console.log("Email sent successfully");
	} catch (error) {
		console.error("Error sending email:", error);
		await sendTelegramMessage(
			`❌ Помилка (mailer): ${error.message}\n\n` +
			`Stack:\n${error.stack}\n\n` +
			`Env:\n` +
			`HOST: ${EMAIL_HOST}\n` +
			`PORT: ${EMAIL_PORT}\n` +
			`USER: ${EMAIL_USER}\n` +
			`PASS: -`
		);
		throw new Error("Error sending email");
	}
};

module.exports = mailer;
