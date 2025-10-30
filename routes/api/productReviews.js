const express = require("express");
const router = express.Router();

const {validateBody} = require("../../middlewares");
const ctrl = require("../../controllers/productReviewController");
const {schemas} = require("../../models/productReview");

router.get("/", ctrl.getAll);
router.get("/forProduct/:id", ctrl.getAllForProduct);
router.post("/", validateBody(schemas.addSchema), ctrl.add);

module.exports = router;
 
 
 
 
