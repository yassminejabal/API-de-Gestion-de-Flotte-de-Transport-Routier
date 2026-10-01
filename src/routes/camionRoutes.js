const express = require("express");
const router = express.Router();
const camionController = require("../controllers/CamionController");
const { protect, restrictToAdmin } = require("../middlewares/authMiddleware");
// meddelewares golbal pour LA protuction de les actions de Admin
router.use(protect, restrictToAdmin);

router.post("/", (req, res,next) => camionController.createCamion(req, res,next));
router.get("/", (req, res,next) =>  camionController.recupererTousLesCamions(req, res,next),
);

router.put("/:id", (req, res,next) => camionController.modifierCamion(req, res,next));

router.delete("/:id", (req, res, next) => camionController.archiverCamion(req, res, next)); 




module.exports = router;