const Camion = require('../models/CamionModel.js');
const Pneu = require('../models/pneuModel.js');

class MaintenanceService {
  async getAlertes() {
    const camionsEnAlerte = await Camion.find({
      $or: [
        { alerteMaintenance: true },
        { statut: 'EN_MAINTENANCE' }
      ]
    }).select('immatriculation marque modele kilometrageActuel statut');

    const pneusEnAlerte = await Pneu.find({
      statut: { $in: ['A_VERIFIER', 'A_REMPLACER'] }
    }).populate('camion', 'immatriculation marque');

    return {
      totalAlertes: camionsEnAlerte.length + pneusEnAlerte.length,
      camions: {
        total: camionsEnAlerte.length,
        liste: camionsEnAlerte
      },
      pneus: {
        total: pneusEnAlerte.length,
        liste: pneusEnAlerte
      }
    };
  }
}

module.exports = new MaintenanceService();
