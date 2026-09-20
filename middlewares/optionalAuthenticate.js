const jwt = require("jsonwebtoken");

const {User} = require("../models/user");

const {SECRET_KEY} = process.env;

const optionalAuthenticate = async (req, res, next) => {
	try {
		const {authorization = ""} = req.headers;
		const [bearer, token] = authorization.split(" ");
		if (bearer !== "Bearer" || !token) {
			return next();
		}

		const {id} = jwt.verify(token, SECRET_KEY);
		const user = await User.findById(id);
		// Accept any of the account's active session tokens (plus the legacy
		// single-token field for pre-migration sessions).
		const isKnownToken =
			(Array.isArray(user?.tokens) && user.tokens.includes(token)) ||
			(user && user.token === token && token);
		if (!user || !isKnownToken) {
			return next();
		}

		req.user = user;
		req.token = token;
		next();
	} catch {
		next();
	}
};

module.exports = optionalAuthenticate;
