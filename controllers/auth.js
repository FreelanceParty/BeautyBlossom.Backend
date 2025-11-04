const createError = require("http-errors");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar"); // для генерації тимчасових аватарів
const path = require("path");
const fs = require("fs/promises");
const {nanoid} = require("nanoid");
const ctrlWrapper = require("../helpers/ctrlWrapper");
const HttpError = require("../helpers/HttpError");

const {User} = require("../models/user");

const mailer = require("./mailer");
// const { HttpError, ctrlWrapper, sendEmail } = require("../helpers");

// const { HttpError, ctrlWrapper } = require("../helpers");

const {SECRET_KEY} = process.env;

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const register = async (req, res) => {
	const {email, password, number} = req.body;
	const user = await User.findOne({email});
	const numberUser = await User.findOne({number});
	if (user) {
		throw HttpError(409, "Email already in use");
	}
	if (numberUser) {
		throw HttpError(409, "The phone number is already in use");
	}
	const hashPassword = await bcrypt.hash(password, 10);
	// для однакових строк хеш різний, (пароль, сіль)
	// сіль це набір випадкових символів
	const avatarURL = gravatar.url(email);
	const verificationCode = nanoid();

	// Передайте адмінські права, якщо відповідний користувач
	const isAdmin = req.body.isAdmin;

	const newUser = await User.create({
		...req.body,
		password: hashPassword,
		avatarURL,
		verificationCode,
		isAdmin:  isAdmin,
	});

	const message = {
		to:      req.body.email,
		subject: "Beauty-blossom",
		text:    `Вітаємо, Ви успішно зареєструвались на нашому сайті!
        
        данні вашого аккаунту:
        login: ${req.body.email}
        password: ${req.body.password}
        
        Не потрібно відповідати на данне повідомлення.
        
        Контакти для зворотнього зв'язку
        +380500529100
        beautyblossom.opt@gmail.com`,
	};
	mailer(message);
	// const verifyEmail = {
	//     to: email,
	//     subject: "Verify email",
	//     html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${verificationCode}">Click verify email</a>`
	// };

	// await sendEmail(verifyEmail);

	res.status(201).json({
		email:     newUser.email,
		firstName: newUser.firstName,
		lastName:  newUser.lastName,
		country:   newUser.country,
		city:      newUser.city,
		optUser:   newUser.optUser,
		isAdmin:   newUser.isAdmin,
	});

	//     res.status(201).json({
	//     email: newUser.email,
	//     name: newUser.name,

	// })
	// }

	// const verifyEmail = async(req, res)=> {
	//     const {verificationCode} = req.params;
	//     const user = await User.findOne({verificationCode});
	//     if(!user){
	//         throw HttpError(401, "Email not found")
	//     }
	//     await User.findByIdAndUpdate(user._id, {verify: true, verificationCode: ""});

	//     res.json({
	//         message: "Email verify success"
	//     })
	// }

	// const resendVerifyEmail = async(req, res)=> {
	//     const {email} = req.body;
	//     const user = await User.findOne({email});
	//     if(!user) {
	//         throw HttpError(401, "Email not found");
	//     }
	//     if(user.verify) {
	//         throw HttpError(401, "Email already verify");
	//     }

	//     const verifyEmail = {
	//         to: email,
	//         subject: "Verify email",
	//         html: `<a target="_blank" href="${BASE_URL}/api/auth/verify/${user.verificationCode}">Click verify email</a>`
	//     };

	//     await sendEmail(verifyEmail);

	//     res.json({
	//         message: "Verify email send success"
	//     })
};

const login = async (req, res) => {
	const {email, password} = req.body;
	const user = await User.findOne({email});
	if (!user) {
		throw HttpError(401, "Email or password invalid");
	}

	// if(!user.verify) {
	//     throw HttpError(401, "Email not verified");
	// }

	const passwordCompare = await bcrypt.compare(password, user.password);
	// в bcrypt є метод компеір передаємо ( не захешований пароль, захешований )
	// якщо 2 арг є захешованою версією першого повертає тру
	if (!passwordCompare) {
		throw HttpError(401, "Email or password invalid");
	}
	if (user.isAdmin) {
		user.isAdmin = true;
	}

	const payload = {
		id: user._id,
	};

	const token = jwt.sign(payload, SECRET_KEY, {expiresIn: "23d"});
	// токен це пропуск складається з пейлоад(може бкти id користувачва)
	// секретний ключ та час життя
	// токен можна розкодувати
	// const decodeToken = jwt.decode(tocken)
	// console.log(decodeToken);
	await User.findByIdAndUpdate(user._id, {token});

	res.json({
		firstName: user.firstName,
		lastName:  user.lastName,
		number:    user.number,
		email:     email,
		token:     token,
		isAdmin:   user.isAdmin,
		optUser:   user.optUser,
	});
};

const getCurrent = async (req, res) => {
	const {_id, email, firstName, lastName, number, isAdmin, optUser} =
		      req.user;
	res.json({
		email,
		firstName,
		lastName,
		number,
		isAdmin,
		optUser,
		_id,
	});
};

const logout = async (req, res) => {
	const {_id} = req.user;
	await User.findByIdAndUpdate(_id, {token: ""});

	res.json({
		message: "Logout success",
	});
};

const updateAvatar = async (req, res) => {
	const {_id} = req.user;
	const {path: tempUpload, originalname} = req.file;
	const filename = `${_id}_${originalname}`;
	const resultUpload = path.join(avatarsDir, filename);
	await fs.rename(tempUpload, resultUpload);
	const avatarURL = path.join("avatars", filename);
	await User.findByIdAndUpdate(_id, {avatarURL});

	res.json({
		avatarURL,
	});
};

const updateUserData = async (req, res) => {
	const {_id} = req.user;
	const {email, firstName, lastName, number} = req.body;

	try {
		// Перевірка, чи користувач існує
		const user = await User.findById(_id);
		if (!user) {
			throw HttpError(404, "User not found");
		}

		// Оновлення даних профілю користувача
		if (firstName) {
			user.firstName = firstName;
		}
		if (lastName) {
			user.lastName = lastName;
		}
		if (number) {
			user.number = number;
		}
		if (email) {
			user.email = email;
		}
		await user.save();

		res.json({
			message: "Profile updated successfully",
		});
	} catch (error) {
		console.error(error);
		throw HttpError(500, "Internal Server Error");
	}
};

const changePassword = async (req, res) => {
	const {_id} = req.user;
	const {oldPassword, newPassword} = req.body;

	try {
		// Перевірка, чи користувач існує
		const user = await User.findById(_id);
		if (!user) {
			throw HttpError(404, "User not found");
		}

		// Перевірка старого паролю
		const passwordCompare = await bcrypt.compare(oldPassword, user.password);
		if (!passwordCompare) {
			throw HttpError(401, "Old password is incorrect");
		}

		// Оновлення паролю
		const hashNewPassword = await bcrypt.hash(newPassword, 10);
		user.password = hashNewPassword;
		await user.save();

		res.json({
			message: "Password changed successfully",
		});
	} catch (error) {
		console.error(error);
		throw error; // just rethrow the error, let the error handler deal with it
	}
};

// const restorePassword = async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       throw new HttpError(404, "User not found");
//     }
//     console.log(user._id);

//     await user.save();

//     const message = {
//       to: email,
//       subject: "Beauty-blossom - відновлення пароля",
//       text: `Вами був створений запит на відновлення паролю на Beauty blossom. Для оновлення пароля перейдіть за посиланням нижче: \n https://www.beautyblossom.com.ua/forgotten/${user._id}`,
//     };
//     mailer(message);

//     res.json({
//       message: "Password changed successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };

const restorePassword = async (req, res) => {
	const {email} = req.body;

	const generateNewPassword = () => {
		const length = 10; // Довжина нового пароля
		const charset =
			      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let newPassword = "";
		for (let i = 0; i < length; i++) {
			const randomIndex = Math.floor(Math.random() * charset.length);
			newPassword += charset[randomIndex];
		}
		return newPassword;
	};

	try {
		const user = await User.findOne({email});
		if (!user) {
			throw createError(404, "User not found");
		}
		console.log(email);
		const newPassword = generateNewPassword(); // Отримання нового пароля (ваша логіка генерації)
		const hashNewPassword = await bcrypt.hash(newPassword, 10);
		user.password = hashNewPassword;
		await user.save();

		const message = {
			to:      email,
			subject: "Beauty-blossom - відновлення пароля",
			text:    `Ваш новий пароль на Beauty blossom: ${newPassword}`,
		};
		mailer(message);

		res.json({
			message: "Password restored successfully",
		});
	} catch (error) {
		console.error(error);
		throw error;
	}
};

const restorePasswordStep2 = async (req, res) => {
	const {_id} = req.body;
	//  const { _id, newPassword } = req.body;
	try {
		const user = await User.findById(_id);
		if (!user) {
			throw new HttpError(404, "User not found");
		}
		console.log(user);
		// const hashNewPassword = await bcrypt.hash(newPassword, 10);
		// user.password = hashNewPassword;
		// await user.save();

		res.json({
			message: "Password restored successfully (step 2)",
		});
	} catch (error) {
		console.error(error);
		throw error;
	}
};

module.exports = {
	register: ctrlWrapper(register),
	// verifyEmail: ctrlWrapper(verifyEmail),
	// resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
	login:                ctrlWrapper(login),
	getCurrent:           ctrlWrapper(getCurrent),
	logout:               ctrlWrapper(logout),
	updateAvatar:         ctrlWrapper(updateAvatar),
	updateUserData:       ctrlWrapper(updateUserData),
	changePassword:       ctrlWrapper(changePassword),
	restorePassword:      ctrlWrapper(restorePassword),
	restorePasswordStep2: ctrlWrapper(restorePasswordStep2),
};
