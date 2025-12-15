const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.end("Test déploiement depuis la CD");
});

module.exports = router;
