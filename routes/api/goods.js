const express = require("express");

const ctrl = require("../../controllers/goods");

const {validateBody, authenticate, requireAdmin} = require("../../middlewares");

const {schemas} = require("../../models/goods");

const router = express.Router();

router.get("/googlefeed", ctrl.getXML);
router.get("/products", ctrl.getCSV);

router.get("/search", ctrl.search);
router.get("/findByBrandName/:brandName", ctrl.findByBrandName);
router.get("/findByCategory/:category", ctrl.findByCategory);

router.get("/fetchPage", ctrl.fetchPage);
router.get("/recommended", ctrl.getRecommended);

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);

router.post("/", authenticate, requireAdmin, validateBody(schemas.addSchema), ctrl.add);

router.put("/:id", authenticate, requireAdmin, validateBody(schemas.addSchema), ctrl.updateById);

router.patch("/:id/checked", authenticate, requireAdmin, validateBody(schemas.updateChekedSchema), ctrl.updateCheked);
router.patch("/:id/amount", authenticate, requireAdmin, validateBody(schemas.updateAmountSchema), ctrl.updateAmount);

router.delete("/:id", authenticate, requireAdmin, ctrl.deleteById);

module.exports = router;

// const express = require("express");

// const ctrl = require("../../controllers/goods");

// const {validateBody, isValidId, authenticate} = require("../../middlewares");

// const {schemas} = require("../../models/goods");

// const router = express.Router();

// router.get("/", authenticate, ctrl.getAll);

// router.get("/:id", authenticate, isValidId, ctrl.getById);

// router.post("/", authenticate, validateBody(schemas.addSchema), ctrl.add);

// router.put("/:id", authenticate, isValidId, validateBody(schemas.addSchema), ctrl.updateById);

// router.patch("/:id/checked", authenticate, isValidId, validateBody(schemas.updateChekedSchema), ctrl.updateCheked);

// router.delete("/:id", authenticate, isValidId, ctrl.deleteById);

// module.exports = router;

// router.get('/', async (request, responce) => {
//     // console.log(request.url);
//     // console.log(request.method);

// //   responce.send(woodModule)
//     // responce.json(woodModule)//json обробляє null тому краще писати так 
//     const result = await wood.getAll();
//     responce.json(result)
// })
// // 1 назва маршруту
// // 2 функцыя яка виконується коли маршрут знайдено

// router.get('/', async (request, responce) => {
//     // console.log(request.url);
//     // console.log(request.method);

// //   responce.send(woodModule)
//     // responce.json(woodModule)//json обробляє null тому краще писати так 
//     const result = await wood.getAll();
//     responce.json(result)
// })
// // 1 назва маршруту
// // 2 функцыя яка виконується коли маршрут знайдено



