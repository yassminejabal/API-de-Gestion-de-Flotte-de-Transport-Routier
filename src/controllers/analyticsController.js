
const AnalyticsService = require("../services/analyticsService");

class AnalyticsController {
  async getTiresHealthMatrix(req, res, next) {
    try {
      const result =
        await AnalyticsService.getTiresHealthMatrix();

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
