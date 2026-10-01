const express = require("express");
const router = express.Router();
const chauffeurController = require("../controllers/ChauffeurController");
const { protect, restrictToAdmin } = require("../middlewares/authMiddleware");

router.use(protect, restrictToAdmin);

router.post("/", (req, res, next) => chauffeurController.creerChauffeur(req, res, next));

router.get("/", (req, res, next) => chauffeurController.recupererTousLesChauffeurs(req, res, next));

router.patch("/:id/suspendre", (req, res, next) => chauffeurController.basculerSuspension(req, res, next));
router.put("/:id", (req, res, next) => chauffeurController.modifierChauffeur(req, res, next));

router.delete("/:id", (req, res, next) => chauffeurController.archiverChauffeur(req, res, next));
module.exports = router;