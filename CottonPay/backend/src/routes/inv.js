/**
 * /inv/:id — redirige (302) vers l'URL d'invitation DIDComm complète.
 * Le wallet suit cette redirection pour lire le paramètre ?oob=.
 */
const express = require('express');
const router = express.Router();
const invStore = require('../services/invStore');

router.get('/:id', (req, res) => {
  const url = invStore.get(req.params.id);
  if (!url) return res.status(404).send('Invitation expirée ou introuvable.');
  res.redirect(302, url);
});

module.exports = router;
