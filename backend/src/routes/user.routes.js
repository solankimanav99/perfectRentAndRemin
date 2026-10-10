const express = require('express');
const { getProfile, updateProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { updateProfileSchema } = require('../validators/user.validator');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.patch('/profile', protect, validate(updateProfileSchema), updateProfile);

module.exports = router;
