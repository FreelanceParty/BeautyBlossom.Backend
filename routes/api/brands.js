const express = require("express");

const ctrl = require("../../controllers/brands");

const {validateBody, authenticate, requireAdmin} = require("../../middlewares");
const {schemas} = require("../../models/brand");
const router = express.Router();

router.get("/", ctrl.getAllBrands);
router.get("/:name", ctrl.getByBrand);

router.post("/", authenticate, requireAdmin, validateBody(schemas.addSchema), ctrl.addBrand);
router.put("/:id", authenticate, requireAdmin, validateBody(schemas.updateSchema), ctrl.updateBrand);
router.delete("/:id", authenticate, requireAdmin, ctrl.deleteBrand);

module.exports = router;
