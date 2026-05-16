const express = require("express");

const ctrl = require("../../controllers/auth");

// const { validateBody, authenticate, upload } = require("../../middlewares");

const {validateBody, authenticate} = require("../../middlewares");

const {schemas} = require("../../models/user");

const router = express.Router();

// signup
router.post("/register", validateBody(schemas.registerSchema), ctrl.register);

// router.get("/verify/:verificationCode", ctrl.verifyEmail);

// router.post("/verify", validateBody(schemas.emailSchema), ctrl.resendVerifyEmail);

// signin
router.post("/login", ctrl.login);
// router.post("/login", validateBody(schemas.loginSchema), ctrl.login);
router.get("/current", authenticate, ctrl.getCurrent);

router.post("/updateUserData/:id", authenticate, ctrl.updateUserData);

router.post("/changePassword", authenticate, ctrl.changePassword);

router.post("/restorePassword", ctrl.restorePassword);

router.post("/restorePasswordStep2", authenticate, ctrl.restorePasswordStep2);

router.post("/logout", authenticate, ctrl.logout);

// router.patch(
//   "/avatars",
//   authenticate,
//   upload.single("avatar"),
//   ctrl.updateAvatar
// );

module.exports = router;
