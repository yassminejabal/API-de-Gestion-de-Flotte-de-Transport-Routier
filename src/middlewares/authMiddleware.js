const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
function restrictToAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({
      status: "fail",
      message: "Accès refusé. Cette action est réservée à l'administrateur.",
    });
  }
  next();
}
async function protect(req, res, next) {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "Accès refusé. Aucun token fourni.",
      });
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "mon_secret_jwt_temporaire",
    );
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "L'utilisateur associe a ce token n'existe plus",
      });
    }
    req.user = currentUser;
    next();
  } catch (error) {
    next()
    return res.status(401).json({
      status: "fail",
      message: "Token invalide ou expiré.",
    });
  }
}
module.exports = { protect, restrictToAdmin };
