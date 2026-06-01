const express = require("express");
const ctrl = require("../../controllers/conversion");
const { validateBody } = require("../../middlewares");
const { schemas } = require("../../models/conversion");

const router = express.Router();

router.post("/", validateBody(schemas.sendSchema), ctrl.send);

module.exports = router;
