const remorqueService = require('../services/RemorqueService');
class RemorqueController{
    async creerRemorque(req, res, next) {
    try {
      const remorque = await remorqueService.creerRemorque(req.body);
      res.status(201).json({
        status: "success",
        message: "Remorque créée avec succès",
        data: { remorque },
      });
    } catch (error) {
      next(error);
    }
  }
  async recupererToutesLesRemorques(req, res, next) {
    try {
      const remorques = await remorqueService.recupererToutesLesRemorques();
      res.status(200).json({
        status: "success",
        resultats: remorques.length,
        data: { remorques },
      });
    } catch (error) {
      next(error);
    }
  }
  async modifierRemorque(req, res, next) {
    try {
      const remorque = await remorqueService.modifierRemorque(req.params.id, req.body);
      res.status(200).json({
        status: "success",
        message: "Remorque mise à jour avec succès",
        data: { remorque },
      });
    } catch (error) {
      next(error);
    }
  }
  async archiverRemorque(req, res, next) {
    try {
      await remorqueService.archiverRemorque(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Remorque archivée avec succès",
      });
    } catch (error) {
      next(error);
    }
  }
}



module.exports = new RemorqueController();