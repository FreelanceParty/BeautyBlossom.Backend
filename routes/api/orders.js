const express = require("express");

const ctrl = require("../../controllers/orders");

const {validateBody, isValidId, authenticate} = require("../../middlewares");

const {schemas} = require("../../models/orders");

const router = express.Router();

router.get("/byUser", authenticate, ctrl.getAllbyUser);

router.get("/", authenticate, ctrl.getAll);

router.post("/", authenticate, validateBody(schemas.addSchema), ctrl.add);

router.get("/:id", authenticate, isValidId, ctrl.getById);

router.put("/:id", authenticate, isValidId, validateBody(schemas.addSchema), ctrl.updateById);

router.patch("/:id/checked", authenticate, isValidId, validateBody(schemas.updateChekedSchema), ctrl.updateCheked);
router.patch("/:id/status", authenticate, isValidId, validateBody(schemas.updateStatusSchema), ctrl.updateStatus);

router.delete("/:id", authenticate, isValidId, ctrl.deleteById);

module.exports = router;
 
 
 
 
