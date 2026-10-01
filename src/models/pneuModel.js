const mongoose = require("mongoose");

const pneuSchema = new mongoose.Schema(
  {
    numeroSerie: {
      type: String,
      required: [true, "Le numéro de série est obligatoire"],
      unique: true,
      trim: true,
    },
    position: {
      type: String,
      position : null   
    },
    kilometrageActuel: {
      type: Number,
      default: 0,
      min: 0,
    },
    seuilUsureKm: {
      type: Number,
      required: [true, "Le seuil d'usure en KM est obligatoire"],
      default: 40000,
    },
    alerteRemplacement: {
      type: Boolean,
      default: false,
    },
    camion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Camion",
      default: null,
    },
    estArchive: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pneu", pneuSchema);