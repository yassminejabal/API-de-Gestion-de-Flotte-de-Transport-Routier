const maintenanceService = require('../services/MaintenanceService.js');

class MaintenanceController {
  async getAlertes(req, res, next) {
    try {
      const alertes = await maintenanceService.getAlertes();
      res.status(200).json({
        status: 'success',
        data: alertes
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = new MaintenanceController();