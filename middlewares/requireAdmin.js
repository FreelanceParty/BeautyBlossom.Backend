const HttpError = require("../helpers/HttpError");

const requireAdmin = (req, res, next) => {
	if (!req.user) {
		return next(HttpError(401));
	}
	if (!req.user.isAdmin) {
		return next(HttpError(403, "Forbidden"));
	}
	next();
};

module.exports = requireAdmin;
