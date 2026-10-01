const Camion = require("../models/CamionModel");
class CamionService {
  async creerCamion(data) {
    const { immatriculation, marque, modele, kilometrageActuel } = data;
    if (!immatriculation || !marque || !modele) {
      const error = new Error(
        "L'immatriculation, la marque et le modèle sont obligatoires",
      );
      error.statusCode = 400;
      throw error;
    }
    const camionExistant = await Camion.findOne({
      immatriculation: immatriculation.toUpperCase().trim(),
    });
    if (camionExistant) {
      const error = new Error(
        "Un camion avec cette immatriculation existe déjà",
      );
      error.statusCode = 409; // 409 conflict
      throw error;
    }
    const nouveauCamion = await Camion.create({
      immatriculation: immatriculation.toUpperCase().trim(),
      marque,
      modele,
      kilometrageActuel: kilometrageActuel || 0,
      statut: "DISPONIBLE",
    });
    return nouveauCamion;
  }
  async recupererTousLesCamions() {
    return await Camion.find();
  }



  async modifierCamion(id, data) {
      const camion = await Camion.findByIdAndUpdate(id, data);
      if (!camion) {
      throw new NotFoundError ('Camion introuvable');
      }
      return camion;
    
  }



  async archiverCamion(id) {
    const camion = await Camion.findOneAndUpdate(
      { _id: id, estArchive: false },
      { estArchive: true },
      { new: true }
    );

    if (!camion) {
      throw new NotFoundError ('Camion introuvable ou déjà supprimé');
    }
    return camion;
  }
}
module.exports = new CamionService();
