const express = require("express");
const ctrl = require("../../controllers/productFilters");
const router = express.Router();

router.get("/", ctrl.getAll);

module.exports = router;
 
 
 
 
