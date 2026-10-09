    const PDFDocument = require('pdfkit')
    class PdfService {
    genererOrdreMission(trajet, dataCallback, endCallback) {

        const doc = new PDFDocument({ margin: 50 });

        doc.on("data", dataCallback);
        doc.on("end", endCallback);


        doc
        .fontSize(20)
        .text("ORDRE DE MISSION", {
            align: "center",
            underline: true
        })
        .moveDown(1.5);



        doc.fontSize(12);

        doc.text(`ID Mission : ${trajet._id}`);

        doc.text(
        `Date de génération : ${new Date().toLocaleDateString("fr-FR")}`
        );

        doc.text(`Statut : ${trajet.statut}`);

        doc.moveDown();


        doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();

        doc.moveDown();

        doc
        .fontSize(14)
        .text("1. Conducteur assigné", {
            underline: true
        });

        doc.fontSize(11);

        doc.text(
        `Nom : ${trajet.chauffeur?.nom || "N/A"}`
        );

        doc.text(
        `Email : ${trajet.chauffeur?.email || "N/A"}`
        );

        doc.moveDown();
        doc
        .fontSize(14)
        .text("2. Véhicules affectés", {
            underline: true
        });

        doc.fontSize(11);

        doc.text(
        `Camion : ${
            trajet.camion?.immatriculation || "N/A"
        } (${
            trajet.camion?.marque || ""
        } ${
            trajet.camion?.modele || ""
        })`
        );

        doc.text(
        `Remorque : ${
            trajet.remorque?.immatriculation || "Aucune"
        } (${
            trajet.remorque?.type || ""
        })`
        );

        doc.moveDown();



        doc
        .fontSize(14)
        .text("3. Itinéraire & Planning", {
            underline: true
        });

        doc.fontSize(11);

        doc.text(
        `Ville de départ : ${trajet.pointDepart || "N/A"}`
        );

        doc.text(
        `Ville d'arrivée : ${trajet.pointArrivee || "N/A"}`
        );

        doc.text(
        `Date départ prévue : ${
            trajet.dateDepartPrevue
            ? new Date(trajet.dateDepartPrevue)
                .toLocaleString("fr-FR")
            : "N/A"
        }`
        );

        doc.text(
        `Date arrivée prévue : ${
            trajet.dateArriveePrevue
            ? new Date(trajet.dateArriveePrevue)
                .toLocaleString("fr-FR")
            : "N/A"
        }`
        );

        doc.text(
        `Kilométrage initial : ${
            trajet.kilometrageDepart || 0
        } km`
        );

        doc.moveDown(2);


        doc.fontSize(12);

        doc.text(
        "Signature du Conducteur :",
        50,
        doc.y,
        { continued: true }
        );

        doc.text(
        "Cachet de la Direction :",
        350,
        doc.y
        );
        doc.end();
    }
    }

    module.exports = new PdfService();
