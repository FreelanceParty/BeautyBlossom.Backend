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
		if (!user || !user.token || user.token !== token) {
			return next();
		}

		req.user = user;
		next();
	} catch {
		next();
	}
};

module.exports = optionalAuthenticate;
