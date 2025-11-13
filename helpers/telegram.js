const axios = require("axios");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramMessage(message) {
	try {
		await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
			chat_id: TELEGRAM_CHAT_ID,
			text:    message,
		});
	} catch (err) {
		console.error('Помилка надсилання в Telegram:', err.message);
	}
}

module.exports = sendTelegramMessage;