const  chauffeurService = require('../services/ChauffeurService')

class ChauffeurController{
      async creerChauffeur(req, res, next) {
      try {
        const chauffeur = await chauffeurService.creerChauffeur(req.body);
        res.status(201).json({
          status: "success",
          message: "Compte chauffeur créé avec succès",
          data: { chauffeur },
        });
      } catch (error) {
        next(error);
      }
    }
  async recupererTousLesChauffeurs(req, res, next) {
    try {
      const chauffeurs = await chauffeurService.recupererTousLesChauffeurs();
      res.status(200).json({
        status: "success",
        resultats: chauffeurs.length,
        data: { chauffeurs },
      });
    } catch (error) {
      next(error);
    }
  }
  async basculerSuspension(req, res, next) {
    try {
      const chauffeur = await chauffeurService.basculerSuspensionChauffeur(req.params.id);
      const action = chauffeur.estSuspendu;
      res.status(200).json({
        status: "success",
        message: `Compte chauffeur ${action} avec succès`,
        data: { chauffeur },
      });
    } catch (error) {
      next(error);
    }
  }
  async modifierChauffeur(req, res, next) {
  try {
    const chauffeur = await chauffeurService.modifierChauffeur(req.params.id, req.body);
    res.status(200).json({ status: "success", data: chauffeur });
  } catch (err) {
    next(err);
  }
}


  async archiverChauffeur(req, res, next) {
    try {
      await chauffeurService.archiverChauffeur(req.params.id);
      res.status(200).json({
        status: "success",
        message: "Chauffeur archivé avec succès",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChauffeurController();
