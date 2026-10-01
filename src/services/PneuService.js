const Pneu = require("../models/pneuModel");
const Camion = require("../models/CamionModel");
const AppError = require("../utils/AppError");

class PneuService{
    async creerPneu(data) {
    const { numeroSerie } = data;

    const pneuExistant = await Pneu.findOne({ numeroSerie });
    if (pneuExistant) {
      throw new ConflictError("Un pneu avec ce numéro de série existe déjà");
    }

    const pneu = await Pneu.create(data);
    return pneu;
  }
  async recupererTousLesPneus() {
    const query = { estArchive: false };
    return await Pneu.find(query).populate("camion", "immatriculation marque modele");
  }



  async assignerPneuACamion(pneuId, camionId, position) {
    if (!camionId || !position) {
      throw new BadRequestError("L'identifiant du camion et la position sont obligatoires");
    } 
    const pneu = await Pneu.findOne({ _id: pneuId, estArchive: false });
    if (!pneu) {
      throw new NotFoundError("Pneu introuvable ou déjà archivé");
    }
    const camion = await Camion.findOne({ _id: camionId, estArchive: false });
    if (!camion) {
      throw new NotFoundError("Camion introuvable ou déjà archivé");
    }

    const positionOccupee = await Pneu.findOne({
      camion: camionId,
      position: position,
      _id: { $ne: pneuId },
      estArchive: false,
    });

    if (positionOccupee) {
      throw new ConflictError(`La position ${position} est déjà occupée sur ce camion`);
    }
    pneu.camion = camionId;
    pneu.position = position;
    await pneu.save();
    return pneu;
  }


  async modifierPneu(id, data) {
    const pneu = await Pneu.findOneAndUpdate(
      { _id: id, estArchive: false },
      data,
      { new: true }
    );

    if (!pneu) {
      throw new NotFoundError("Pneu introuvable ou déjà archivé");
    }

    return pneu;
  }
async archiverPneu(id) {
    const pneu = await Pneu.findOneAndUpdate(
      { _id: id, estArchive: false },
      { estArchive: true, camion: null, position: null },
      { new: true }
    );

    if (!pneu) {
      throw new NotFoundError("Pneu introuvable ou déjà archivé");
    }

    return pneu;
  }
}

module.exports = new PneuService();