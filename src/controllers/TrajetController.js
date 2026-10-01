const trajetService = require('../services/TrajetService');
class TrajetController{
    async creerTrajet(req, res, next) {
    try {
      const trajet = await trajetService.creerTrajet(req.body);
      res.status(201).json({
        status: "success",
        message: "Trajet planifié et assigné avec succès",
        data: { trajet },
      });
    } catch (error) {
      next(error);
    }
  }
  async recupererTousLesTrajets(req, res, next) {
    try {
      const trajets = await trajetService.recupererTousLesTrajets();
      res.status(200).json({
        status: "success",
        resultats: trajets.length,
        data: { trajets },
      });
    } catch (error) {
      next(error);
    }
  }
  async recupererTrajetParId(req, res, next) {
    try {
      const trajet = await trajetService.recupererTrajetParId(req.params.id);
      res.status(200).json({
        status: "success",
        data: { trajet },
      });
    } catch (error) {
      next(error);
    }
  }
  async recupererMesTrajets(req, res, next) {
    try {
      const trajets = await trajetService.recupererTrajetsParChauffeur(req.user._id);
      res.status(200).json({
        status: "success",
        resultats: trajets.length,
        data: { trajets },
      });
    } catch (error) {
      next(error);
    }
  }
  async demarrerTrajet(req, res, next) {
  try {
    const { kilometrageDepart } = req.body;
    const trajet = await trajetService.demarrerTrajet(
      req.params.id,
      req.user._id,
      kilometrageDepart
    );
    res.status(200).json({
      status: "success",
      message: "Trajet démarré avec succès",
      data: { trajet },
    });
  } catch (error) {
    next(error);
  }
}

async terminerTrajet(req, res, next) {
  try {
    const trajet = await trajetService.terminerTrajet(
      req.params.id,
      req.user._id,
      req.body
    );
    
    res.status(200).json({
      status: "success",
      message: "Trajet terminé avec succès",
      data: { trajet },
    });
  } catch (error) {
    next(error);
  }
}
}

module.exports = new TrajetController();
