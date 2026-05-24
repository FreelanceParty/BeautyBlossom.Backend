const axios = require("axios");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramMessage(subject, message) {
	try {
		const text = `❌${subject}\n\n${message}`;
		await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
			chat_id: TELEGRAM_CHAT_ID,
			text:    text,
		});
	} catch (err) {
		console.error('Помилка надсилання в Telegram:', err.message);
	}
}

module.exports = sendTelegramMessage;