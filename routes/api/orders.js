const express = require("express");

const ctrl = require("../../controllers/orders");

const {validateBody, isValidId, authenticate, optionalAuthenticate} = require("../../middlewares");

const {schemas} = require("../../models/orders");

const router = express.Router();

router.get("/byUser", authenticate, ctrl.getAllbyUser);

router.get("/", authenticate, ctrl.getAll);

router.post("/", optionalAuthenticate, validateBody(schemas.addSchema), ctrl.add);

router.put("/:id", authenticate, isValidId, validateBody(schemas.addSchema), ctrl.updateById);

router.patch("/:id/checked", authenticate, isValidId, validateBody(schemas.updateCheckedSchema), ctrl.updateChecked);
router.patch("/:id/status", authenticate, isValidId, validateBody(schemas.updateStatusSchema), ctrl.updateStatus);

router.delete("/:id", authenticate, isValidId, ctrl.deleteById);

router.get("/:id", authenticate, isValidId, ctrl.getById);

module.exports = router;
 
 
 
 
