const Trajet = require("../../src/models/TrajetModel");
const storageService = require("../../src/services/StorageService");
const pdfService = require("../../src/services/PdfService");
const trajetController = require("../../src/controllers/TrajetController");

jest.mock("../../src/models/TrajetModel");
jest.mock("../../src/services/StorageService");
jest.mock("../../src/services/PdfService");

function createRequest(trajet) {
  const query = {
    populate: jest.fn().mockReturnThis(),
    then: (resolve) => resolve(trajet),
  };
  Trajet.findOne.mockReturnValue(query);

  return {
    req: { params: { id: "trip-123" }, user: { id: "admin-1", role: "ADMIN" } },
    res: { status: jest.fn().mockReturnThis(), json: jest.fn() },
    next: jest.fn(),
  };
}

describe("TrajetController - version du PDF d'ordre de mission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pdfService.templateVersion = "2.0.1";
    pdfService.genererOrdreMission.mockImplementation((trajet, onData, onEnd) => {
      onData(Buffer.from("%PDF preview"));
      onEnd();
    });
    storageService.uploadMissionOrder.mockImplementation(async (buffer, s3Key) => ({
      bucket: "fleettrack-documents",
      s3Key,
      sizeBytes: buffer.length,
    }));
    storageService.getPresignedDownloadUrl.mockResolvedValue("https://signed.example/mission.pdf");
  });

  it("regenerates and stores a versioned PDF when a cached document has an older template", async () => {
    const trajet = {
      _id: "trip-123",
      estArchive: false,
      missionOrderDocument: {
        s3Key: "orders/2026/TRP-2026-trip-123.pdf",
        templateVersion: null,
      },
      save: jest.fn().mockResolvedValue(undefined),
    };
    const { req, res, next } = createRequest(trajet);

    await trajetController.getMissionOrderPresignedUrl(req, res, next);

    expect(pdfService.genererOrdreMission).toHaveBeenCalledWith(
      trajet,
      expect.any(Function),
      expect.any(Function),
    );
    expect(storageService.uploadMissionOrder).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringMatching(/trip-123-v2\.0\.1\.pdf$/),
    );
    expect(trajet.missionOrderDocument.templateVersion).toBe("2.0.1");
    expect(trajet.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it("reuses the cached PDF when its template version is current", async () => {
    const trajet = {
      _id: "trip-123",
      estArchive: false,
      missionOrderDocument: {
        s3Key: "orders/2026/TRP-2026-trip-123-v2.0.1.pdf",
        templateVersion: "2.0.1",
      },
      save: jest.fn(),
    };
    const { req, res, next } = createRequest(trajet);

    await trajetController.getMissionOrderPresignedUrl(req, res, next);

    expect(pdfService.genererOrdreMission).not.toHaveBeenCalled();
    expect(storageService.uploadMissionOrder).not.toHaveBeenCalled();
    expect(storageService.getPresignedDownloadUrl).toHaveBeenCalledWith(
      trajet.missionOrderDocument.s3Key,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });
});
