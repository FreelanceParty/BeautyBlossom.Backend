const express = require("express");

const ctrl = require("../../controllers/brands");

const router = express.Router();

router.get("/", ctrl.getAllBrands);
router.get("/:name", ctrl.getByBrand);

module.exports = router;
