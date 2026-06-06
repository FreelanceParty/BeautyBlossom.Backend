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

const {escapeHtml, wrapWithBrandedLayout, getBrandedLogoAttachment} = require("../helpers/emailTemplate");

// const { HttpError, ctrlWrapper } = require("../helpers");

const {SECRET_KEY} = process.env;

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const sendTelegramMessage = require("../helpers/telegram");

const normalizePhone = require("../helpers/normalizePhone");

const register = async (req, res) => {
	try {
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

		const newUser = await User.create({
			email,
			password:    hashPassword,
			number,
			firstName:   req.body.firstName,
			lastName:    req.body.lastName,
			country:     req.body.country,
			city:        req.body.city,
			link:        req.body.link,
			offlineShop: req.body.offlineShop,
			onlineShop:  req.body.onlineShop,
			socialMedia: req.body.socialMedia,
			optUser:     req.body.optUser,
			avatarURL,
			verificationCode,
			isAdmin:     false,
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

		setImmediate(() => {
			(async () => {
				const contentHtml = `
					<div style="font-size:14px;line-height:20px;color:#111827;white-space:pre-wrap;">${escapeHtml(message.text)}</div>
				`;
				const html = wrapWithBrandedLayout({
					title: "Вітаємо у Beauty Blossom",
					contentHtml,
					cta:   {url: "https://www.beautyblossom.com.ua/", label: "Перейти на сайт"},
				});
				let attachments;
				try {
					attachments = [await getBrandedLogoAttachment()];
				} catch (e) {
					attachments = undefined;
				}
				await mailer({...message, html, attachments});
			})().catch(() => {
			});
		});

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
	} catch (e) {
		if (e.status !== 409) {
			await sendTelegramMessage(
				"Backend. controllers/auth/register",
				`Error: ${e.message}`
			);
		}
		console.error(e);
		throw e;
	}
};

const login = async (req, res) => {
	try {
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
	} catch (e) {
		if (e.status !== 401) {
			await sendTelegramMessage(
				"Backend. controllers/auth/login",
				`Error: ${e.message}`
			);
		}
		console.error(e);
		throw e;
	}
};

const getCurrent = async (req, res) => {
	try {
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
	} catch (e) {
		await sendTelegramMessage(
			"Backend. controllers/auth/getCurrent",
			`Error: ${e.message}`
		);
		console.error(e);
		throw e;
	}
};

const logout = async (req, res) => {
	try {
		const {_id} = req.user;
		await User.findByIdAndUpdate(_id, {token: ""});

		res.json({
			message: "Logout success",
		});
	} catch (e) {
		await sendTelegramMessage(
			"Backend. controllers/auth/logout",
			`Error: ${e.message}`
		);
		console.error(e);
		throw e;
	}
};

const updateAvatar = async (req, res) => {
	try {
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
	} catch (e) {
		await sendTelegramMessage(
			"Backend. controllers/auth/updateAvatar",
			`Error: ${e.message}`
		);
	}
};

const updateUserData = async (req, res) => {
	try {
		const {_id} = req.user;
		const {email, firstName, lastName, number} = req.body;
		const normalizedNumber = number !== undefined ? normalizePhone(number) : undefined;

		// Перевірка, чи користувач існує
		const user = await User.findById(_id);
		if (!user) {
			throw HttpError(404, "User not found");
		}

		if (email && email !== user.email) {
			const existingEmailUser = await User.findOne({
				email,
				_id: {$ne: _id},
			});
			if (existingEmailUser) {
				throw HttpError(409, "Email already in use", {
					code: "EMAIL_TAKEN",
					meta: {field: "email"},
				});
			}
		}

		if (normalizedNumber && normalizedNumber !== user.number) {
			const existingNumberUser = await User.findOne({
				number: normalizedNumber,
				_id: {$ne: _id},
			});
			if (existingNumberUser) {
				throw HttpError(409, "The phone number is already in use", {
					code: "PHONE_TAKEN",
					meta: {field: "number"},
				});
			}
		}

		// Оновлення даних профілю користувача
		if (firstName) {
			user.firstName = firstName;
		}
		if (lastName) {
			user.lastName = lastName;
		}
		if (normalizedNumber) {
			user.number = normalizedNumber;
		}
		if (email) {
			user.email = email;
		}
		await user.save();

		res.json({
			message: "Profile updated successfully",
		});
	} catch (e) {
		if (![400, 404, 409].includes(e.status)) {
			await sendTelegramMessage(
				`❌ Помилка (Backend. controllers/auth/updateUserData): ${e.message}\n\n`
			);
		}
		console.error(e);
		throw e;
	}
};

const changePassword = async (req, res) => {
	try {
		const {_id} = req.user;
		const {oldPassword, newPassword} = req.body;

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
	} catch (e) {
		if (e.status !== 404 && e.status !== 401) {
			await sendTelegramMessage(
				`❌ Помилка (Backend. controllers/auth/changePassword): ${e.message}\n\n`
			);
		}
		console.error(e);
		throw e; // just rethrow the error, let the error handler deal with it
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
	try {
		const {email} = req.body;
		if (!email) {
			throw createError(400, "Email is required");
		}
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

		setImmediate(() => {
			Promise.resolve()
				.then(async () => {
					const contentHtml = `
						<div style="font-size:14px;line-height:20px;color:#111827;">Ваш новий пароль:</div>
						<div style="height:10px;line-height:10px;">&nbsp;</div>
						<div style="padding:12px 14px;border:1px dashed #e5e7eb;border-radius:12px;background:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:700;letter-spacing:0.2px;">${escapeHtml(newPassword)}</div>
						<div style="height:10px;line-height:10px;">&nbsp;</div>
						<div style="font-size:13px;line-height:18px;color:#6b7280;">Якщо ви не запитували зміну пароля — просто проігноруйте цей лист.</div>
					`;
					const html = wrapWithBrandedLayout({
						title: "Відновлення пароля",
						contentHtml,
						cta:   {url: "https://www.beautyblossom.com.ua/", label: "Перейти на сайт"},
					});
					let attachments;
					try {
						attachments = [await getBrandedLogoAttachment()];
					} catch (e) {
						attachments = undefined;
					}
					await mailer({...message, html, attachments});
				})
				.catch(() => {
				});
		});

		res.json({
			message: "Password restored successfully",
		});
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				`❌ Помилка (Backend. controllers/auth/restorePassword): ${e.message}\n\n`
			);
		}
		console.error(e);
		throw e;
	}
};

const restorePasswordStep2 = async (req, res) => {
	try {
		const {_id} = req.body;
		//  const { _id, newPassword } = req.body;
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
	} catch (e) {
		if (e.status !== 404) {
			await sendTelegramMessage(
				`❌ Помилка (Backend. controllers/auth/restorePasswordStep2): ${e.message}\n\n`
			);
		}
		console.error(e);
		throw e;
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
