const express = require("express");

const ctrl = require("../../controllers/users");

const {authenticate, requireAdmin} = require("../../middlewares");

const router = express.Router();

router.post("/", authenticate, requireAdmin, ctrl.getUsers);

module.exports = router;
