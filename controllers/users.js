const {User} = require("../models/user");
const ctrlWrapper = require("../helpers/ctrlWrapper");

const sendTelegramMessage = require("../helpers/telegram");

const getUsers = async (req, res) => {
	try {
		const result = await User.find(
			{},
			{firstName: 1, lastName: 1, email: 1, number: 1, _id: 0}
		); // Вибираємо лише необхідні властивості з об'єктів

		const simplifiedData = result.map((user) => ({
			// Створюємо новий масив об'єктів з вибраними властивостями
			firstName: user.firstName,
			lastName:  user.lastName,
			email:     user.email,
			number:    user.number,
		}));

		res.json(simplifiedData);
	} catch (error) {
		await sendTelegramMessage(
			`❌ Помилка (Backend. controllers/users/getUsers): ${error.message}\n\n`
		);
		console.error(error);
		res.status(500).json({message: "Internal Server Error"});
	}
};
module.exports = {
	getUsers: ctrlWrapper(getUsers),
};
