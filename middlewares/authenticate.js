const jwt = require("jsonwebtoken");

const {User} = require("../models/user");

const HttpError = require("../helpers/HttpError");

const {SECRET_KEY} = process.env;

const authenticate = async (req, res, next) => {
    const {authorization = ""} = req.headers;
    // якщо токен не прийшов то бек ламається залишаємо =""
    const [bearer, token] = authorization.split(" ");
    if (bearer !== "Bearer" || !token) {
        return next(HttpError(401));
    }
    try {
    const { id } = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(id);
    // Valid if the token is one of the account's active session tokens.
    // Also accept the legacy single-token field for sessions created before
    // the multi-session migration.
    const isKnownToken =
      (Array.isArray(user?.tokens) && user.tokens.includes(token)) ||
      (user && user.token === token && token);
    if (!user || !isKnownToken) {
      return next(HttpError(401));
    }
    req.user = user;
    req.token = token;
    next();
  } catch {
    next(HttpError(401));
  }
};     

module.exports = authenticate;