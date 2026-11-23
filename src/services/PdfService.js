const PDFDocument = require("pdfkit");

const COLORS = {
  navy: "#0D1B2B",
  navySoft: "#182B40",
  amber: "#FFB400",
  ink: "#172333",
  muted: "#687587",
  line: "#DCE2E8",
  wash: "#F3F6F9",
  white: "#FFFFFF",
  green: "#28764D",
  blue: "#35658F",
  red: "#A83D3D",
};

const STATUS_LABELS = {
  A_FAIRE: "À FAIRE",
  EN_COURS: "EN COURS",
  TERMINE: "TERMINÉ",
  ANNULE: "ANNULÉ",
};

const STATUS_COLORS = {
  A_FAIRE: COLORS.amber,
  EN_COURS: COLORS.blue,
  TERMINE: COLORS.green,
  ANNULE: COLORS.red,
};

function display(value, fallback = "Non renseigné") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function formatDate(value) {
  if (!value) return "Non planifiée";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non planifiée";
  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

class PdfService {
  genererOrdreMission(trajet, dataCallback, endCallback) {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 38, right: 42, bottom: 42, left: 42 },
      info: {
        Title: "Ordre de mission FleetTrackPRO",
        Subject: `Mission ${display(trajet._id)}`,
        Author: "FleetTrackPRO",
      },
    });

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 42;
    const contentWidth = pageWidth - margin * 2;
    const contentBottom = pageHeight - 42;

    doc.on("data", dataCallback);
    doc.on("end", endCallback);

    const drawContinuationHeader = () => {
      doc.rect(0, 0, pageWidth, 13).fill(COLORS.navy);
      doc.rect(0, 13, pageWidth, 3).fill(COLORS.amber);
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor(COLORS.navy)
        .text("FleetTrackPRO  /  ORDRE DE MISSION", margin, 28);
      doc.y = 48;
    };

    const ensureSpace = (height) => {
      if (doc.y + height > contentBottom) {
        doc.addPage();
        drawContinuationHeader();
      }
    };

    const drawSectionTitle = (title) => {
      ensureSpace(38);
      const y = doc.y + 2;
      doc.roundedRect(margin, y, 5, 16, 2).fill(COLORS.amber);
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(COLORS.navy)
        .text(title, margin + 14, y + 1, { width: contentWidth - 14 });
      doc.y = y + 23;
    };

    const drawInfoTable = (title, rows) => {
      drawSectionTitle(title);
      const labelWidth = 142;
      const valueWidth = contentWidth - labelWidth;

      rows.forEach(([label, rawValue], index) => {
        const value = display(rawValue);
        doc.font("Helvetica").fontSize(9.5);
        const valueHeight = doc.heightOfString(value, {
          width: valueWidth - 20,
          lineGap: 2,
        });
        const rowHeight = Math.max(24, valueHeight + 12);
        ensureSpace(rowHeight + 2);

        const y = doc.y;
        const background = index % 2 === 0 ? COLORS.white : COLORS.wash;
        doc.rect(margin, y, contentWidth, rowHeight).fill(background);
        doc.rect(margin, y, labelWidth, rowHeight).fill(COLORS.wash);
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(COLORS.muted)
          .text(label, margin + 10, y + 7, {
            width: labelWidth - 18,
          });
        doc
          .font("Helvetica")
          .fontSize(9.5)
          .fillColor(COLORS.ink)
          .text(value, margin + labelWidth + 10, y + 6, {
            width: valueWidth - 20,
            lineGap: 2,
          });
        doc
          .rect(margin, y, contentWidth, rowHeight)
          .lineWidth(0.6)
          .strokeColor(COLORS.line)
          .stroke();
        doc
          .moveTo(margin + labelWidth, y)
          .lineTo(margin + labelWidth, y + rowHeight)
          .lineWidth(0.6)
          .strokeColor(COLORS.line)
          .stroke();
        doc.y = y + rowHeight;
      });
      doc.moveDown(0.35);
    };

    const drawGridTable = (title, headers, rows, widths) => {
      drawSectionTitle(title);
      const headerHeight = 23;
      ensureSpace(headerHeight + 32);

      const drawTableHeader = () => {
        let x = margin;
        const y = doc.y;
        headers.forEach((header, index) => {
          doc.rect(x, y, widths[index], headerHeight).fill(COLORS.navySoft);
          doc
            .font("Helvetica-Bold")
            .fontSize(8.5)
            .fillColor(COLORS.white)
            .text(header, x + 8, y + 8, { width: widths[index] - 16 });
          x += widths[index];
        });
        doc.y = y + headerHeight;
      };

      drawTableHeader();
      rows.forEach((row, rowIndex) => {
        doc.font("Helvetica").fontSize(9);
        const cellHeights = row.map((cell, index) =>
          doc.heightOfString(display(cell), {
            width: widths[index] - 16,
            lineGap: 2,
          }),
        );
        const rowHeight = Math.max(27, ...cellHeights.map((height) => height + 12));
        if (doc.y + rowHeight > contentBottom) {
          doc.addPage();
          drawContinuationHeader();
          drawTableHeader();
        }

        let x = margin;
        const y = doc.y;
        row.forEach((cell, index) => {
          doc
            .rect(x, y, widths[index], rowHeight)
            .fill(rowIndex % 2 === 0 ? COLORS.white : COLORS.wash);
          doc
            .font(index === 0 ? "Helvetica-Bold" : "Helvetica")
            .fontSize(9)
            .fillColor(index === 0 ? COLORS.navy : COLORS.ink)
              .text(display(cell), x + 8, y + 7, {
              width: widths[index] - 16,
              lineGap: 2,
            });
          doc
            .rect(x, y, widths[index], rowHeight)
            .lineWidth(0.6)
            .strokeColor(COLORS.line)
            .stroke();
          x += widths[index];
        });
        doc.y = y + rowHeight;
      });
      doc.moveDown(0.35);
    };

    const status = display(trajet.statut, "A_FAIRE").toUpperCase();
    const statusLabel = STATUS_LABELS[status] || status;
    const statusColor = STATUS_COLORS[status] || COLORS.amber;

    // Brand header using the FleetTrackPRO navy and amber palette.
    doc.rect(0, 0, pageWidth, 96).fill(COLORS.navy);
    doc.rect(0, 0, 8, 96).fill(COLORS.amber);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(COLORS.amber)
      .text("FleetTrackPRO", margin, 18);
    doc
      .font("Helvetica-Bold")
      .fontSize(23)
      .fillColor(COLORS.white)
      .text("ORDRE DE MISSION", margin, 39);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#D5DDE6")
      .text("Document opérationnel de transport", margin, 71);

    const badgeWidth = 104;
    const badgeX = pageWidth - margin - badgeWidth;
    doc
      .roundedRect(badgeX, 40, badgeWidth, 25, 12)
      .fill(statusColor);
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(status === "A_FAIRE" ? COLORS.navy : COLORS.white)
      .text(statusLabel, badgeX + 7, 48, {
        width: badgeWidth - 14,
        align: "center",
      });

    doc.y = 108;
    drawInfoTable("Références de la mission", [
      ["Identifiant", display(trajet._id)],
      ["Généré le", formatDate(trajet.missionOrderDocument?.generatedAt || new Date())],
    ]);

    const chauffeurName = [trajet.chauffeur?.prenom, trajet.chauffeur?.nom]
      .filter(Boolean)
      .join(" ");
    drawInfoTable("Conducteur assigné", [
      ["Nom complet", chauffeurName || trajet.chauffeur?.nom || "Non renseigné"],
      ["E-mail", trajet.chauffeur?.email],
      ["Téléphone", trajet.chauffeur?.telephone],
    ]);

    const truckDetails = [trajet.camion?.marque, trajet.camion?.modele]
      .filter(Boolean)
      .join(" ");
    drawGridTable(
      "Véhicules affectés",
      ["Ressource", "Immatriculation", "Détails"],
      [
        ["Camion", trajet.camion?.immatriculation, truckDetails],
        ["Remorque", trajet.remorque?.immatriculation, trajet.remorque?.type],
      ],
      [102, 150, contentWidth - 252],
    );

    drawGridTable(
      "Itinéraire et planning",
      ["Étape", "Ville", "Date prévue"],
      [
        ["Départ", trajet.pointDepart, formatDate(trajet.dateDepartPrevue)],
        ["Arrivée", trajet.pointArrivee, formatDate(trajet.dateArriveePrevue)],
      ],
      [93, 196, contentWidth - 289],
    );

    drawInfoTable("Informations complémentaires", [
      ["Marchandise", trajet.marchandise],
      [
        "Kilométrage de départ",
        trajet.kilometrageDepart === null || trajet.kilometrageDepart === undefined
          ? "À renseigner au départ"
          : `${trajet.kilometrageDepart} km`,
      ],
      [
        "Kilométrage d'arrivée",
        trajet.kilometrageArrivee === null || trajet.kilometrageArrivee === undefined
          ? "À renseigner à l'arrivée"
          : `${trajet.kilometrageArrivee} km`,
      ],
    ]);

    ensureSpace(115);
    drawSectionTitle("Signatures et validation");
    const signatureY = doc.y;
    const gap = 14;
    const signatureWidth = (contentWidth - gap) / 2;
    const signatureHeight = 78;
    [margin, margin + signatureWidth + gap].forEach((x) => {
      doc
        .roundedRect(x, signatureY, signatureWidth, signatureHeight, 5)
        .lineWidth(0.8)
        .strokeColor(COLORS.line)
        .stroke();
    });
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(COLORS.navy)
      .text("Signature du conducteur", margin + 10, signatureY + 10, {
        width: signatureWidth - 20,
      })
      .text("Visa et cachet de la direction", margin + signatureWidth + gap + 10, signatureY + 10, {
        width: signatureWidth - 20,
      });
    doc
      .moveTo(margin + 10, signatureY + 59)
      .lineTo(margin + signatureWidth - 10, signatureY + 59)
      .strokeColor(COLORS.line)
      .stroke();
    doc
      .moveTo(margin + signatureWidth + gap + 10, signatureY + 59)
      .lineTo(margin + signatureWidth * 2 + gap - 10, signatureY + 59)
      .strokeColor(COLORS.line)
      .stroke();

    const footerY = Math.min(signatureY + signatureHeight + 16, contentBottom - 12);
    doc
      .moveTo(margin, footerY)
      .lineTo(pageWidth - margin, footerY)
      .lineWidth(0.7)
      .strokeColor(COLORS.line)
      .stroke();
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(COLORS.muted)
      .text("FleetTrackPRO  •  Document généré automatiquement", margin, footerY + 7, {
        width: contentWidth,
        align: "center",
      });

    doc.end();
  }
}

module.exports = new PdfService();
