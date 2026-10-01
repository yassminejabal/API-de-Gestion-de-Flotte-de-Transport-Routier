const express = require("express");
const router = express.Router();
const pneuController = require("../controllers/PneuController");
const { protect, restrictToAdmin } = require("../middlewares/authMiddleware");

router.use(protect, restrictToAdmin);

router.post("/", (req, res, next) => pneuController.creerPneu(req, res, next));

router.get("/", (req, res, next) => pneuController.recupererTousLesPneus(req, res, next));

router.put("/:id/assigner", (req, res, next) => pneuController.assignerPneu(req, res, next));

router.put("/:id", (req, res, next) => pneuController.modifierPneu(req, res, next));

router.delete("/:id", (req, res, next) => pneuController.archiverPneu(req, res, next));

module.exports = router;