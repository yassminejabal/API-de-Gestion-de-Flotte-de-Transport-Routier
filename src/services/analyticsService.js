const Trajet = require("../models/TrajetModel");
const Pneu = require("../models/PneuModel");    
class AnalyticsService {
  async getDriversEcoPerformance() {
    const pipeline = [
      {
        $match: {
          statut: "TERMINE",
          estArchive: false,
        },
      },
      {
        $addFields: {
          distanceParcourue: {
            $subtract: [
              "$kilometrageArrivee",
              "$kilometrageDepart",
            ],
          },
        },
      },
      {
        $match: {
          distanceParcourue: { $gt: 0 },
          volumeGasoilConsommeLitres: { $gte: 0 },
        },
      },
      {
        $group: {
          _id: "$chauffeur",
          totalGasoil: {
            $sum: "$volumeGasoilConsommeLitres",
          },
          distanceTotale: {
            $sum: "$distanceParcourue",
          },
        },
      },
      {
        $addFields: {
          consommationMoyenne: {
            $multiply: [
              {
                $divide: [
                  "$totalGasoil",
                  "$distanceTotale",
                ],
              },
              100,
            ],
          },
        },
      },
      {
        $addFields: {
          scoreEco: {
            $max: [
              0,
              {
                $min: [
                  100,
                  {
                    $subtract: [
                      100,
                      {
                        $multiply: [
                          {
                            $subtract: [
                              "$consommationMoyenne",
                              30,
                            ],
                          },
                          2.5,
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    ];

    return await Trajet.aggregate(pipeline);
  }







  async getTiresHealthMatrix() {
  const pipeline = [
    // 1. Filtrer les pneus actifs
    {
      $match: {
        estArchive: false
      }
    },

    // 2. Calculer le kilométrage restant
    {
      $addFields: {
        kilometres_restants: {
          $max: [
            0,
            {
              $subtract: [
                { $ifNull: ["$seuilUsureKm", 80000] },
                "$kilometrageActuel"
              ]
            }
          ]
        }
      }
    },

    // 3. Identifier les pneus critiques
    {
      $addFields: {
        isCritical: {
          $lt: ["$kilometres_restants", 5000]
        }
      }
    },

    // 4. Regrouper par position
    {
      $group: {
        _id: "$position",
        nombrePneus: { $sum: 1 },
        kilometrageMoyen: { $avg: "$kilometrageActuel" },
        nombrePneusCritiques: {
          $sum: { $cond: ["$isCritical", 1, 0] }
        },
        budgetEstime: {
          $sum: { $cond: ["$isCritical", 3800, 0] }
        }
      }
    }
  ];

  return Pneu.aggregate(pipeline);
}
}
// cond ila kan shih =>  true === 3800 ila kan false => 0
module.exports = new AnalyticsService();
