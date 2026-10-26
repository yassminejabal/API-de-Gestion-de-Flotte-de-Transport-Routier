const pdfService = require('../../src/services/PdfService');

describe('Suite de tests unitaires - PdfService', () => {
  it('devrait générer un PDF d\'ordre de mission valide et invoquer les callbacks data et end', (done) => {
    const mockTrajet = {
      _id: 'trajet123',
      statut: 'EN_COURS',
      chauffeur: { nom: 'Dupont', email: 'dupont@example.com' },
      camion: { immatriculation: '12345-A-1', marque: 'Volvo', modele: 'FH' },
      remorque: { immatriculation: '99999-B-2', type: 'Frigorifique' },
      pointDepart: 'Casablanca',
      pointArrivee: 'Tanger',
      dateDepartPrevue: new Date('2026-10-26T08:00:00Z'),
      dateArriveePrevue: new Date('2026-10-26T14:00:00Z'),
      kilometrageDepart: 1500,
    };

    const chunks = [];
    pdfService.genererOrdreMission(
      mockTrajet,
      (chunk) => chunks.push(chunk),
      () => {
        try {
          expect(chunks.length).toBeGreaterThan(0);
          const buffer = Buffer.concat(chunks);
          expect(buffer.toString('utf8', 0, 4)).toBe('%PDF');
          done();
        } catch (err) {
          done(err);
        }
      }
    );
  });

  it('devrait gérer les véhicules et dates manquantes avec des valeurs de repli', (done) => {
    const mockTrajetMinimal = {
      _id: 'trajetMinimal',
      statut: 'A_FAIRE',
    };

    const chunks = [];
    pdfService.genererOrdreMission(
      mockTrajetMinimal,
      (chunk) => chunks.push(chunk),
      () => {
        try {
          expect(chunks.length).toBeGreaterThan(0);
          const buffer = Buffer.concat(chunks);
          expect(buffer.length).toBeGreaterThan(100);
          done();
        } catch (err) {
          done(err);
        }
      }
    );
  });
});
