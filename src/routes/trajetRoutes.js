const express = require("express");
const router = express.Router();
const trajetController = require("../controllers/TrajetController");
const { protect, restrictToAdmin } = require("../middlewares/authMiddleware");

router.use(protect);

router.get("/mes-trajets", (req, res, next) =>
  trajetController.recupererMesTrajets(req, res, next)
);

router.post("/", restrictToAdmin, (req, res, next) =>
  trajetController.creerTrajet(req, res, next)
);
router.get("/", restrictToAdmin, (req, res, next) =>
  trajetController.recupererTousLesTrajets(req, res, next)
);
router.get("/:id", (req, res, next) =>
  trajetController.recupererTrajetParId(req, res, next)
);

router.patch("/:id/demarrer", (req, res, next) =>
  trajetController.demarrerTrajet(req, res, next)
);


router.patch("/:id/terminer", (req, res, next) =>
  trajetController.terminerTrajet(req, res, next)
);

module.exports = router;