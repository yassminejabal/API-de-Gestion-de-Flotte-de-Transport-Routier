function errorHandler(err , req , res,next) {
  
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Erreur serveur';
    res.status(statusCode).json({
    status: 'error',
    message: message
  });
}

module.exports = errorHandler;