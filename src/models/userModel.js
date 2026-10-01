const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userSchema = new mongoose.Schema(
  {
    prenom: {
      type: String,
      trim: true,
    },
    telephone: {
      type: String,
      trim: true,
    },
    nom: {
      type: String,
      required: [true, "Le nom est obligatoire"],
    },
    email: {
      type: String,
      required: [true, "email est obligatoire"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est obligatoire"],
      select: false,
    },
    role: {
      type: String,
      enum: ["ADMIN", "CHAUFFEUR"],
      default: "CHAUFFEUR",
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    actif: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// pre comme un medllwere (pre hooks)
//   Pre-hook (pre) 9bal dir wahad tritement
// Post-hook (post)
//   Post-hook (post) man  ba3ad wahad tritement
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

module.exports = mongoose.model("User", userSchema);
