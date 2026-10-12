const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getSupervisors, createSupervisor, updateSupervisor, deleteSupervisor } = require('../controllers/supervisorController');

router.get('/', getSupervisors);
router.post('/', protect, adminOnly, createSupervisor);
router.put('/:id', protect, adminOnly, updateSupervisor);
router.delete('/:id', protect, adminOnly, deleteSupervisor);

module.exports = router;