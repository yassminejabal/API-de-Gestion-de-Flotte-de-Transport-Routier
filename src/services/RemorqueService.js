const Remorque = require("../models/remorqueModel");
const appError = require("../utils/AppError");
class RemorqueService{
    async creerRemorque(data) {
    const { immatriculation } = data;

    const remorqueExistante = await Remorque.findOne({ immatriculation });
    if (remorqueExistante) {
      throw new ConflictError("Une remorque avec cette immatriculation existe déjà");
    }

    const remorque = await Remorque.create(data);
    return remorque;
  }
  async recupererToutesLesRemorques() {
    return await Remorque.find({ estArchive: false });
  }
  async modifierRemorque(id, data) {
    const remorque = await Remorque.findOneAndUpdate(
      { _id: id, estArchive: false },
      data,
      {new: true}
      // pour prendre la derniere modification de data remouque 
    );

    if (!remorque) {
      throw new NotFoundError("Remorque introuvable ou déjà archivée");
    }
    return remorque;
  }
  async archiverRemorque(id) {
    const remorque = await Remorque.findOneAndUpdate(
      { _id: id, estArchive: false },
      { estArchive: true },
      { new: true }
    );

    if (!remorque) {
      throw new NotFoundError("Remorque introuvable ou déjà archivée");
    }
    return remorque;
  }
}

module.exports = new RemorqueService();
