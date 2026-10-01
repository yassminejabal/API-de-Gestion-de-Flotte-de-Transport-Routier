class AppError extends Error{
    constructor(message , statusCode){
        //super methode de class parent   error.message  ===  super(message)
        // 3lax madrnax this.message = message hitax radi ndiro wahad proprty akhra smaytha message au aslan rah 3and E
        super(message)
        // hadi hitax makaynax 3and Error error.statusCode makaynax
        this.statusCode = statusCode    
        // cette methode appel ternary operator
        // pour stricturer les error
        this.status =` ${statusCode}`.startsWith('4') ? 'fail' : 'error';
        // n'est pas un error mallee
        this.isOperationel = true;
        //this === error
        // this.constructor  la class qui tu as instansi qui dans cette cas AppError
        Error.captureStackTrace(this , this.constructor)
        // afficher  le lieu de l'error sans afficher constricteur et l'error       
    }
}


// 400 Bad Request
class  BadRequestError extends AppError {
    constructor(message = 'Mauvaise requête') {
        super(message, 400);
    }   
}


// 401 Unathorized
class UnauthorizedError extends AppError{
    constructor(message = 'Accès non autorisé'){
        super(message , 401)
    }
}

// 404 not found

class NotFoundError extends AppError{
    constructor(message = 'Ressource non trouvée'){
        super(message , 404)
    }
}

// 409 ConflictDuplicate immatriculation)

class ConflictError extends AppError {
    constructor(message = 'immatriculation déjà existante'){
        super(message, 409);
    }
}
// 500 Internal Server Error
class InternalServerError extends AppError {
  constructor(message = 'Erreur interne du serveur') {
    super(message, 500);
  }
}
module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  InternalServerError
};