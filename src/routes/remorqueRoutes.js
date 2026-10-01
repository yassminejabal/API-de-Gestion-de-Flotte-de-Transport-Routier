const express = require("express");
const router = express.Router();
const remorqueController = require("../controllers/RemorqueController");
const { protect, restrictToAdmin } = require("../middlewares/authMiddleware");

router.use(protect, restrictToAdmin);

router.post("/", (req, res, next) => remorqueController.creerRemorque(req, res, next));

router.get("/", (req, res, next) => remorqueController.recupererToutesLesRemorques(req, res, next));

router.put("/:id", (req, res, next) => remorqueController.modifierRemorque(req, res, next));

router.delete("/:id", (req, res, next) => remorqueController.archiverRemorque(req, res, next));

module.exports = router;