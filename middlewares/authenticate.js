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
    if (!user || !user.token || user.token !== token) {
      return next(HttpError(401));
    }
    req.user = user;
    next();
  } catch {
    next(HttpError(401));
  }
};     

module.exports = authenticate;