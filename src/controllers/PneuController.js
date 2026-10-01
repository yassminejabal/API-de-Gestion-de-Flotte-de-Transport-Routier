const pneuService = require('../services/PneuService')


class PneuController{
    async creerPneu(req, res, next) {
    try {
      const pneu = await pneuService.creerPneu(req.body);
      res.status(201).json({
        status: "success",
        message: "Pneu créé avec succès",
        data: { pneu },
      });
    } catch (error) {
      next(error);
    }
  }

  async recupererTousLesPneus(req, res, next) {
    try {
      const pneus = await pneuService.recupererTousLesPneus(req.query);
      res.status(200).json({
        status: "success",
        resultats: pneus.length,
        data: { pneus },
      });
    } catch (error) {
      next(error);
    }
  }
  async assignerPneu(req, res, next) {
    try {
      const { camionId, position } = req.body;
      const pneu = await pneuService.assignerPneuACamion(req.params.id, camionId, position);
      res.status(200).json({
        status: "success",
        message: "Pneu assigné au camion avec succès",
        data: { pneu },
      });
    } catch (error) {
      next(error);
    }
  }
  async modifierPneu(req, res, next) {
    try {
      const pneu = await pneuService.modifierPneu(req.params.id, req.body);
      res.status(200).json({
        status: "success",
        message: "Pneu mis à jour avec succès",
        data: { pneu },
      });
    } catch (error) {
      next(error);
    }
  }
  async archiverPneu(req, res, next) {
    try {
      await pneuService.archiverPneu(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Pneu archivé avec succès",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PneuController();
