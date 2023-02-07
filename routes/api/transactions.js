const express = require("express");

const router = express.Router();

const ctrl = require("../../controllers/transactions");
const { validateBody, authenticate } = require("../../middlewares");
const { addSchema } = require("../../models/transaction");

router.get("/", authenticate, ctrl.getAll);
router.post("/", authenticate, validateBody(addSchema), ctrl.add);
router.delete("/:transactionId", authenticate, ctrl.removeById);
module.exports = router;
