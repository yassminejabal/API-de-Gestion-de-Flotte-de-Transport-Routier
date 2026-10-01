const camionService = require("../services/CamionService");
class CamionController {
  async createCamion(req, res,next) {
    try {
      // pour les colomn il ya dans body de req
      const camion = await camionService.creerCamion(req.body);
      res.status(201).json({
        status: "success",
        message: "Camion créé avec succès",
        data: { camion },
      });
    } catch (error) {
      next(error)
    }
  }
  async recupererTousLesCamions(req, res,next) {
    try {
      const camions = await camionService.recupererTousLesCamions();
      res.status(200).json({
        status: "success",
        resultats: camions.length,
        data: { camions },
      });
    } catch (error) {
        next(error)
    }
  }
  async modifierCamion (req, res,next) {
  try {
    const camion = await camionService.modifierCamion(req.params.id, req.body);
    res.status(200).json({
      status: "success",
      message: "Camion mis à jour avec succès",
      data: { camion },
    });
  } catch (error) {
    next(error)
  }
}
async archiverCamion(req, res, next) {
    try {
      await camionService.archiverCamion(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Camion archivé avec succès",
      });
    } catch (error) {
      next(error);
    }
  }


}
module.exports = new CamionController();