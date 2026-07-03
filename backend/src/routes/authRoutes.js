const express = require('express');
const router = express.Router();
const { registerRider, loginRider, registerDriver, loginDriver } = require('../controllers/authController');

router.post('/register/rider', registerRider);
router.post('/login/rider', loginRider);

router.post('/register/driver', registerDriver);
router.post('/login/driver', loginDriver);

module.exports = router;
