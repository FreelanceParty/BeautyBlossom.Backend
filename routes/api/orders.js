const express = require("express");

const ctrl = require("../../controllers/orders");

const {validateBody, isValidId, authenticate, optionalAuthenticate, requireAdmin} = require("../../middlewares");

const {schemas} = require("../../models/orders");

const router = express.Router();

router.get("/byUser", authenticate, ctrl.getAllbyUser);

router.get("/", authenticate, requireAdmin, ctrl.getAll);

router.post("/", optionalAuthenticate, validateBody(schemas.addSchema), ctrl.add);

router.put("/:id", authenticate, requireAdmin, isValidId, validateBody(schemas.addSchema), ctrl.updateById);

router.patch("/:id/checked", authenticate, requireAdmin, isValidId, validateBody(schemas.updateCheckedSchema), ctrl.updateChecked);
router.patch("/:id/status", authenticate, requireAdmin, isValidId, validateBody(schemas.updateStatusSchema), ctrl.updateStatus);

router.delete("/:id", authenticate, requireAdmin, isValidId, ctrl.deleteById);

router.get("/:id", authenticate, requireAdmin, isValidId, ctrl.getById);

module.exports = router;
 
 
 
 
