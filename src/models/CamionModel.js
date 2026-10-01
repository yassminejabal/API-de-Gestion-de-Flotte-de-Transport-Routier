const mongoose = require("mongoose");


const camionSchema = new mongoose.Schema(
    {
        immatriculation: {
      type: String,
      required: [true, "L'immatriculation est obligatoire"],
      unique: true,
      trim: true,
    },
    marque: {
      type: String,
      required: [true, "La marque est obligatoire"],
      trim: true,
    },
    modele: {
      type: String,
      required: [true, "Le modèle est obligatoire"],
      trim: true,
    },
    kilometrageActuel: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Le kilometrage ne peut pas etre negatif"],
    },
    statut: {
      type: String,
      enum: {
        values: ["DISPONIBLE", "EN_TRAJET", "EN_MAINTENANCE"],
        message: "{VALUE} n'est pas un statut valide",
      },
      default: "DISPONIBLE",
    },
    alerteMaintenance: {
      type: Boolean,
      default: false,
    },
    pneus: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pneu",
      },
    ],
    estArchive: {
      type: Boolean,
      default: false,
    },
    },
    {timestamp : true}
)
module.exports = mongoose.model("Camion", camionSchema);