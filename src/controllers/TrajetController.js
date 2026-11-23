const trajetService = require('../services/TrajetService');
const storageService = require('../services/StorageService');
const Trajet = require('../models/TrajetModel');
const pdfService = require('../services/PdfService');
const genererPdfBuffer = (trajet, pdfService) => {
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      pdfService.genererOrdreMission(
        trajet,
        (data) => chunks.push(data),
        () => resolve(Buffer.concat(chunks))
      );
    } catch (err) {
      reject(err);
    }
  });
};
class TrajetController{

async getMissionOrderPresignedUrl(req, res, next) {
    try {
      const { id } = req.params;
      const trajet = await Trajet.findOne({ _id: id, estArchive: false })
        .populate('chauffeur', 'nom prenom email telephone')
        .populate('camion', 'immatriculation marque modele')
        .populate('remorque', 'immatriculation type');

      if (!trajet) {
        return res.status(404).json({
          status: 'fail',
          message: 'Trajet introuvable'
        });
      }

      const userId = (req.user?.id || req.user?._id || '').toString();
      const userRole = (req.user?.role || '').toLowerCase();

      const isAdmin = userRole === 'admin';
      const assignedDriverId = trajet.chauffeur?._id ? trajet.chauffeur._id.toString() : trajet.chauffeur?.toString();
      const isAssignedDriver = assignedDriverId && assignedDriverId === userId;

      if (!isAdmin && !isAssignedDriver) {
        return res.status(403).json({
          status: 'fail',
          message: 'Accès interdit : vous devez être admin ou le chauffeur assigné à ce trajet.'
        });
      }

      // 2. Génération Lazy (On-demand) et téléversement vers MinIO si inexistant
      const templateVersion = pdfService.templateVersion;
      if (
        !trajet.missionOrderDocument ||
        !trajet.missionOrderDocument.s3Key ||
        trajet.missionOrderDocument.templateVersion !== templateVersion
      ) {
        const currentYear = new Date().getFullYear();
        const s3Key = `orders/${currentYear}/TRP-${currentYear}-${trajet._id}-v${templateVersion}.pdf`;
        // Génération du Buffer PDF
        const pdfBuffer = await genererPdfBuffer(trajet, pdfService);
        const metadata = await storageService.uploadMissionOrder(pdfBuffer, s3Key);
        // Sauvegarde des métadonnées dans MongoDB
        trajet.missionOrderDocument = {
          bucket: metadata.bucket || 'fleettrack-documents',
          s3Key: metadata.s3Key || s3Key,
          sizeBytes: metadata.sizeBytes || pdfBuffer.length,
          templateVersion,
          generatedAt: new Date()
        };
        await trajet.save();
      }

      // 3. Génération de l'URL pré-signée (expiration : 15 minutes / 900s)
      const downloadUrl = await storageService.getPresignedDownloadUrl(trajet.missionOrderDocument.s3Key);

      return res.status(200).json({
        success: true,
        message: 'Presigned URL générée avec succès (expiration : 15 minutes)',
        expiresInSeconds: 900,
        s3Key: trajet.missionOrderDocument.s3Key,
        downloadUrl
      });
      
    } catch (error) {
      next(error);
    }
  }











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


 async genererOrdreMission(req, res, next) {
        try {
            const trajet = await Trajet.findOne({ _id: req.params.id, estArchive: false })
                .populate('chauffeur', 'nom prenom email telephone')
                .populate('camion', 'immatriculation marque modele')
                .populate('remorque', 'immatriculation type');

            if (!trajet) {
                return res.status(404).json({
                    message: 'Trajet introuvable'
                });
            }

            const chunks = [];

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="ordre-mission-${trajet._id}.pdf"`);
            pdfService.genererOrdreMission(
                trajet,
                data => chunks.push(data),
                () => res.send(Buffer.concat(chunks))
            );

        } catch (error) {
            next(error);
        }
    }

}

module.exports = new TrajetController();




























































































