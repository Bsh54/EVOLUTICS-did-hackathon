/**
 * Authentication Middleware
 * Vérifie les sessions et les rôles (coopérative vs producteur)
 */

const coopService = require('../services/coopService');

/**
 * Vérifie que l'utilisateur est authentifié (session active)
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: 'Non authentifié',
      message: 'Veuillez vous connecter via eSignet'
    });
  }
  next();
}

/**
 * Vérifie que l'utilisateur est un membre de coopérative
 * Attache req.coop avec les données de la coopérative
 */
function requireCoopAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: 'Non authentifié',
      message: 'Veuillez vous connecter via eSignet'
    });
  }

  const memberNpi = req.session.user.sub;
  const coop = coopService.getCoopByMemberNpi(memberNpi);

  if (!coop) {
    return res.status(403).json({
      error: 'Accès refusé',
      message: 'Votre NPI n\'est pas enregistré comme membre d\'une coopérative'
    });
  }

  // Attacher les données de la coopérative à la requête
  req.coop = coop;
  req.memberNpi = memberNpi;
  next();
}

/**
 * Vérifie que l'utilisateur est un producteur enregistré
 * Attache req.producer avec les données du producteur
 */
function requireProducerAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: 'Non authentifié',
      message: 'Veuillez vous connecter via eSignet'
    });
  }

  const producerNpi = req.session.user.sub;
  const producer = coopService.getProducerByNpi(producerNpi);

  if (!producer) {
    return res.status(403).json({
      error: 'Accès refusé',
      message: 'Votre NPI n\'est pas enregistré comme producteur dans une coopérative'
    });
  }

  req.producer = producer;
  req.producerNpi = producerNpi;
  next();
}

/**
 * Vérifie qu'une session de vérification éphémère existe
 * (créée après validation OTP sur la page /verify)
 */
function requireVerifySession(req, res, next) {
  if (!req.session || !req.session.verifiedNpi) {
    return res.status(401).json({
      error: 'Session expirée',
      message: 'Veuillez recommencer la vérification'
    });
  }
  next();
}

module.exports = {
  requireAuth,
  requireCoopAuth,
  requireProducerAuth,
  requireVerifySession
};
