const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  createInspection,
  getInspections,
  getInspectionById,
  updateInspectionStatus,
  deleteInspection
} = require('../controllers/inspectionController');

router.post('/', upload.array('images', 10), createInspection);
router.get('/', protect, adminOnly, getInspections);
router.get('/:id', protect, adminOnly, getInspectionById);
router.put('/:id/status', protect, adminOnly, updateInspectionStatus);
router.delete('/:id', protect, adminOnly, deleteInspection);

module.exports = router;