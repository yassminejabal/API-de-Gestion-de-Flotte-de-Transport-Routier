const Trajet = require("../models/TrajetModel");
const Camion = require("../models/CamionModel");
const Remorque = require("../models/remorqueModel");
const User = require("../models/userModel");

const {
  NotFoundError,
  ConflictError,
  BadRequestError,
} = require("../utils/AppError");

class TrajetService {
  async verifierDisponibilite(camionId, remorqueId, chauffeurId) {
    const trajetActifCamion = await Trajet.findOne({
      camion: camionId,
      statut: { $in: ["A_FAIRE", "EN_COURS"] },
      estArchive: false,
    });
    if (trajetActifCamion) {
      throw new ConflictError(
        "Ce camion est déjà assigné à une mission active ou planifiée",
      );
    }

    const trajetActifRemorque = await Trajet.findOne({
      remorque: remorqueId,
      statut: { $in: ["A_FAIRE", "EN_COURS"] },
      estArchive: false,
    });
    if (trajetActifRemorque) {
      throw new ConflictError(
        "Cette remorque est déjà assignée à une mission active ou planifiée",
      );
    }

    // verifier dispo camion
    const camion = await Camion.findOne({ _id: camionId, estArchive: false });
    if (!camion) {
      throw new NotFoundError("Camion introuvable ou archivé");
    }
    if (camion.alerteMaintenance) {
      throw new ConflictError(
        "Le camion sélectionné a une alerte de maintenance active",
      );
    }
    if (camion.statut !== "DISPONIBLE") {
      throw new ConflictError(
        `Le camion n'est pas disponible (statut: ${camion.statut})`,
      );
    }

    // verifier dispo remorque
    const remorque = await Remorque.findOne({
      _id: remorqueId,
      estArchive: false,
    });
    if (!remorque) {
      throw new NotFoundError("Remorque introuvable ou archivée");
    }
    if (remorque.alerteMaintenance) {
      throw new ConflictError(
        "La remorque sélectionnée a une alerte de maintenance active",
      );
    }
    if (remorque.statut !== "DISPONIBLE") {
      throw new ConflictError(
        `La remorque n'est pas disponible (statut: ${remorque.statut})`,
      );
    }
    // verifier dispo chauffeur
    const chauffeur = await User.findOne({ _id: chauffeurId, actif: true });
    if (!chauffeur) {
      throw new NotFoundError("Chauffeur introuvable ou archivé");
    }
    if (chauffeur.role !== "CHAUFFEUR") {
      throw new BadRequestError(
        "L'utilisateur assigné doit avoir le rôle CHAUFFEUR",
      );
    }
    if (chauffeur.estSuspendu) {
      throw new ConflictError("Le compte de ce chauffeur est suspendu");
    }

    // verifier aucune trajet a cheffeur
    //
    const trajetActifChauffeur = await Trajet.findOne({
      chauffeur: chauffeurId,
      statut: { $in: ["A_FAIRE", "EN_COURS"] },
      estArchive: false,
    });
    if (trajetActifChauffeur) {
      throw new ConflictError(
        "Ce chauffeur a déjà une mission active ou planifiée",
      );
    }

    return { camion, remorque, chauffeur };
  }
  async creerTrajet(data) {
    const {
      camion: camionId,
      remorque: remorqueId,
      chauffeur: chauffeurId,
    } = data;

    const { camion, remorque } = await this.verifierDisponibilite(
      camionId,
      remorqueId,
      chauffeurId,
    );

    const trajet = await Trajet.create(data);
    camion.statut = "EN_TRAJET";
    await camion.save();
    remorque.statut = "EN_TRAJET";
    await remorque.save();
    return trajet;
  }

  async recupererTousLesTrajets() {
    return await Trajet.find({ estArchive: false })
      .populate("camion", "immatriculation marque modele statut")
      .populate("remorque", "immatriculation type capaciteMaxKg")
      .populate("chauffeur", "nom prenom email telephone");
  }
  async recupererTrajetsParChauffeur(chauffeurId) {
    return await Trajet.find({ chauffeur: chauffeurId, estArchive: false })
      .populate("camion", "immatriculation marque modele")
      .populate("remorque", "immatriculation type");
  }
  async recupererTrajetParId(id, user) {
    const trajet = await Trajet.findOne({ _id: id, estArchive: false })
      .populate("camion")
      .populate("remorque")
      .populate("chauffeur", "nom prenom email telephone");
    if (!trajet) {
      throw new NotFoundError("Trajet introuvable ou archivé");
    }
    if (
      user.role === "CHAUFFEUR" &&
      trajet.chauffeur._id.toString() !== user._id.toString()
    ) {
      throw new BadRequestError(
        "Vous n'êtes pas autorisé à consulter ce trajet",
      );
    }
    return trajet;
  }
  async demarrerTrajet(trajetId, chauffeurId, kilometrageDepart) {
    const trajet = await Trajet.findOne({ _id: trajetId, estArchive: false });
    if (!trajet) throw new NotFoundError("Trajet introuvable");

    if (trajet.chauffeur.toString() !== chauffeurId.toString()) {
      throw new BadRequestError("Vous n'êtes pas assigné à ce trajet");
    }

    if (trajet.statut !== "A_FAIRE") {
      throw new BadRequestError(
        `Impossible de démarrer un trajet avec le statut: ${trajet.statut}`,
      );
    }

    if (!kilometrageDepart || Number(kilometrageDepart) <= 0) {
      throw new BadRequestError("Le kilométrage de départ est invalide");
    }

    trajet.kilometrageDepart = Number(kilometrageDepart);
    trajet.statut = "EN_COURS";
    await trajet.save();

    return trajet;
  }
  async terminerTrajet(trajetId, chauffeurId, donneesFin) {
    const {
      kilometrageArrivee,
      volumeGasoilConsommeLitres,
      remarquesChauffeur,
    } = donneesFin;

    const trajet = await Trajet.findOne({ _id: trajetId, estArchive: false });
    if (!trajet) throw new NotFoundError("Trajet introuvable");

    if (trajet.chauffeur.toString() !== chauffeurId.toString()) {
      throw new BadRequestError("Vous n'êtes pas assigné à ce trajet");
    }

    if (trajet.statut !== "EN_COURS") {
      throw new BadRequestError(
        "Le trajet doit être EN_COURS pour être terminé",
      );
    }

    if (
      !kilometrageArrivee ||
      Number(kilometrageArrivee) <= Number(trajet.kilometrageDepart)
    ) {
      throw new BadRequestError(
        "Le kilométrage d'arrivée doit être strictement supérieur au kilométrage de départ",
      );
    }

    if (
      !volumeGasoilConsommeLitres ||
      Number(volumeGasoilConsommeLitres) <= 0
    ) {
      throw new BadRequestError("Le volume de gasoil consommé est invalide");
    }

    const PRIX_LITRE_GASOIL = 13;
    const coutCarburant =
      Number(volumeGasoilConsommeLitres) * PRIX_LITRE_GASOIL;

    trajet.kilometrageArrivee = Number(kilometrageArrivee);
    trajet.volumeGasoilConsommeLitres = Number(volumeGasoilConsommeLitres);
    trajet.coutCarburant = coutCarburant;
    trajet.remarquesChauffeur = remarquesChauffeur || "";
    trajet.statut = "TERMINE";
    await trajet.save();

    const distance =
      Number(kilometrageArrivee) - Number(trajet.kilometrageDepart);

    await Camion.findByIdAndUpdate(trajet.camion, {
      statut: "DISPONIBLE",
      $inc: { kilometrageActuel: distance },
    });

    await Remorque.findByIdAndUpdate(trajet.remorque, {
      statut: "DISPONIBLE",
    });

    return trajet;
  }
}
module.exports = new TrajetService();
