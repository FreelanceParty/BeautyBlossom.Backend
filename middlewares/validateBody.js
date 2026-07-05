const {HttpError} = require("../helpers");

const joiOptions = {
	allowUnknown: true,
	abortEarly: false,
};

const validateBody = schema => {
	const func = (req, res, next) => {
		const {error, value} = schema.validate(req.body, joiOptions);
		if (error) {
			// errors[field] = повідомлення українською для зручного відображення на фронті
			const errors = {};
			for (const detail of error.details) {
				const field = detail.path.join(".") || "body";
				if (!errors[field]) errors[field] = detail.message;
			}
			const firstMessage = Object.values(errors)[0] || error.message;
			return next(HttpError(400, firstMessage, {isValidation: true, isCustom: true, errors}));
		}
		req.body = value;
		next()
	}

	return func;
}

module.exports = validateBody;