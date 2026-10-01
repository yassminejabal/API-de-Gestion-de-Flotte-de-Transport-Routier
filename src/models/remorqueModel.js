const mongoose = require("mongoose");


const remorqueSchema = new mongoose.Schema({
    immatriculation: {
      type: String,
      required: [true, "L'immatriculation est obligatoire"],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Le type de remorque est obligatoire"],
      trim: true,
    },
    capaciteMaxKg: {
      type: Number,
      required: [true, "La capacité maximale en KG est obligatoire"],
      min: [0, "La capacite ne peut pas etre ne gative"],
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
    estArchive: {
      type: Boolean,
      default: false,
    },
},
{timestamps : true});
module.exports = mongoose.model("Remorque",remorqueSchema)