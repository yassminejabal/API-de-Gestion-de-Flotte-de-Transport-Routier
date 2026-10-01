const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");
const { ConflictError, NotFoundError } = require("../utils/AppError");
const crypto = require("crypto");
class ChauffeurService {
  async creerChauffeur(data) {
    const { nom, prenom, email, telephone } = data;

    const userExistant = await User.findOne({ email });
    if (userExistant) {
      throw new ConflictError("Un utilisateur avec cet email existe déjà");
    }
    //crypto faire des valeurs aleatoire et securiser c'est un pakage
    // crypto.randomBytes(4) => a3 7f 12 c9
    // toString("hex") = > "a3 7f 12 c9"
    // + "A1!" => "a3 7f 12 c9A1!"
    const motDePasseTemporaire = crypto.randomBytes(4).toString("hex") + "A1!";

    const chauffeur = await User.create({
      nom,
      prenom,
      email,
      telephone,
      password: motDePasseTemporaire,
      role: "CHAUFFEUR",
      estSuspendu: false,
      estArchive: false,
    });

    const messageHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Bienvenue sur l'application de Gestion de Flotte</h2>
        <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
        <p>Votre compte chauffeur a été créé par l'administrateur. Voici vos identifiants pour vous connecter :</p>
        <table style="border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email :</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Mot de passe temporaire :</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;"><code>${motDePasseTemporaire}</code></td>
          </tr>
        </table>
        <p style="color: #c0392b;"><em>Il est vivement conseillé de changer votre mot de passe dès votre première connexion.</em></p>
      </div>
    `;

    try {
      await sendEmail({
        email: chauffeur.email,
        subject: "Vos identifiants d'accès - Flotte de Transport",
        html: messageHtml,
      });
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'email:", err.message);
    }
    chauffeur.password = undefined;
    return chauffeur;
  }
  async recupererTousLesChauffeurs() {
    return await User.find({ role: "CHAUFFEUR", actif: true }).select(
      "-password",
    );
  }

  async basculerSuspensionChauffeur(id) {
    const chauffeur = await User.findOne({
      _id: id,
      role: "CHAUFFEUR",
      actif: true,
    }).select("-password");
    if (!chauffeur) {
      throw new NotFoundError("Chauffeur introuvable ou archivé");
    }

    chauffeur.estSuspendu = !chauffeur.estSuspendu;
    await chauffeur.save();
    chauffeur.password = undefined;
    return chauffeur;
  }

  async archiverChauffeur(id) {
    const chauffeur = await User.findOneAndUpdate(
      { _id: id, role: "CHAUFFEUR", actif: true },
      { actif: false },
      { new: true },
    ).select("-password");

    if (!chauffeur) {
      throw new NotFoundError("Chauffeur introuvable ou déjà archivé");
    }
    return chauffeur;
  }
  async modifierChauffeur(id, donneesModifiees) {
    const chauffeur = await User.findOneAndUpdate(
      { _id: id, role: "CHAUFFEUR", actif: true },
      donneesModifiees
    ).select("-motDePasse -password");
    if (!chauffeur) {
      throw new NotFoundError("Chauffeur introuvable ou inactif");
    }

    return chauffeur;
  }
}

module.exports = new ChauffeurService();

