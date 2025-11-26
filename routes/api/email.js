const express = require("express");
const {sendEmail} = require("../../controllers/nodemailer"); // Імпорт функції sendEmail з контролера
const {uploadEmail} = require("../../middlewares/upload"); // Імпорт middleware для завантаження файлів

const router = express.Router();

router.post("/sendemail", uploadEmail, async (req, res) => {
	try {
		// Отримання шляхів до завантажених файлів та генерація cid
		const paths = req.files.map((file, index) => ({
			filename: file.filename,
			path:     file.path,
			cid:      `image-${Date.now()}-${index}@nodemailer.com`,
		}));

		// Виклик функції sendEmail з контролера та отримання результату
		const result = await sendEmail(paths, req, res);
		res.send(result); // Відправлення результату клієнту
	} catch (error) {
		res.status(500).send("Error occurred while sending the email"); // Обробка помилки
	}
});

module.exports = router;
