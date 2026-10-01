const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
class AuthService {
  genererToken(userId) {
    // jwt.sign()=> gener token avec les donner jwt secert et date experde et des donner de Client
    return jwt.sign(
      { id: userId }, // paylod
      process.env.JWT_SECRET || "mon_secret_jwt_temporaire", // secert key
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }, //  date d'expiration
    );
  }

    async register(data = {}) {
        // distruction
        const { nom, email, password, role } = data;
        // nom = date.nom .....
        if (!nom || !email || !password) {
        const error = new Error("Tous les champs sont obligatoires");
        error.statusCode = 400;
        throw error;
    }
        const exest_deja = await User.findOne({email});
        if (exest_deja) {
        const error = new Error("Cet email est deja utilise");
        error.statusCode = 400;
        throw error;
        }
        const newUser = await User.create({nom , email ,password , role});

        const userResponse = newUser.toObject();
        // car mongoose katjib des des methode avec newUser
        delete userResponse.password;
        const token = this.genererToken(newUser._id);
        return {user : userResponse , token }
    }


  async login(email , password){
    if (!email || !password){
        const error = new Error('Email et mot de passe sont obligatoires');
        error.statusCode = 400;
        throw error;
  }

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
      const error = new Error('Email ou mot de passe incorrect');
      error.statusCode = 401;
      throw error;
    }
    const estValide = await bcrypt.compare(password, user.password);
    if (!estValide) {
      const error = new Error('Email ou mot de passe incorrect');
      error.statusCode = 401;
      throw error;
    }

const token = this.genererToken(user._id);
    user.password = undefined;

    return { user, token };
    }
}


module.exports = new AuthService();