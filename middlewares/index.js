const validateBody = require("./validateBody");
const isValidId = require("./isValidId")
const authenticate = require("./authenticate")
const uploadEmail = require("./upload")

module.exports = {
	validateBody,
	isValidId,
	authenticate,
	uploadEmail,
}