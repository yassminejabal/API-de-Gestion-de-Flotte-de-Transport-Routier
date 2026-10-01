const mongoose = require('mongoose');
const trajetSchema = new mongoose.Schema({
    pointDepart: {
      type: String,
      required: [true, "Le site de départ est obligatoire"],
      trim: true,
    },
    pointArrivee: {
      type: String,
      required: [true, "Le site d'arrivée est obligatoire"],
      trim: true,
    },
    marchandise: {
      type: String,
      required: [true, "La description de la marchandise est obligatoire"],
      trim: true,
    },
    dateDepartPrevue: {
      type: Date,
      required: [true, "La date de départ prévue est obligatoire"],
    },
    dateArriveePrevue: {
      type: Date,
      required: [true, "La date d'arrivée prévue est obligatoire"],
    },
    chauffeur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'assignation d'un chauffeur est obligatoire"],
    },
    camion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Camion",
      required: [true, "L'assignation d'un camion est obligatoire"],
    },
    remorque: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Remorque",
      required: [true, "L'assignation d'une remorque est obligatoire"],
    },
    statut: {
      type: String,
      enum: {
        values: ["A_FAIRE", "EN_COURS", "TERMINE", "ANNULE"],
      },
      default: "A_FAIRE",
    },
    kilometrageDepart: {
      type: Number,
      default: null,
    },
    kilometrageArrivee: {
      type: Number,
      default: null,
    },
    volumeGasoilConsommeLitres: {
      type: Number,
      default: null,
    },
    coutCarburant: {
      type: Number,
      default: null,
    },
    remarquesChauffeur: {
      type: String,
      default: "",
      trim: true,
    },
    estArchive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Trajet", trajetSchema);