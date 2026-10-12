const Inspection = require('../models/Inspection');
const { uploadImageBuffer, deleteImage } = require('../services/cloudinaryService');

const calculateQuarter = (date) => {
  const month = new Date(date).getMonth() + 1;
  if (month >= 1 && month <= 3) return 'Q1';
  if (month >= 4 && month <= 6) return 'Q2';
  if (month >= 7 && month <= 9) return 'Q3';
  return 'Q4';
};

exports.createInspection = async (req, res, next) => {
  try {
    const data = req.body;
    
    // Generate Serial and Reference Number
    const count = await Inspection.countDocuments();
    const serialNumber = count + 1;
    const year = new Date().getFullYear();
    const referenceNumber = `DIR-${year}-${String(serialNumber).padStart(6, '0')}`;

    // Auto-calculate quarter if date is present
    const inspectionDate = new Date(data.dateOfInspection);
    const quarter = calculateQuarter(inspectionDate);

    let processedImages = [];

    // Check if images were sent as Base64 JSON array from frontend (Our current setup)
    if (data.images && Array.isArray(data.images) && data.images.length > 0) {
      processedImages = data.images.map((img, index) => ({
        url: img.url, // This contains the Base64 string
        caption: img.caption || '',
        filename: `image_${index}.jpg`
      }));
    } 
    // Fallback: Process traditional uploaded files (multer) if they exist
    else if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const uploadRes = await uploadImageBuffer(file.buffer);
        processedImages.push({
          url: uploadRes.url,
          publicId: uploadRes.publicId,
          filename: file.originalname,
          caption: data[`imageCaption_${i}`] || ''
        });
      }
    }

    const newInspection = await Inspection.create({
      ...data,
      referenceNumber,
      serialNumber,
      quarter,
      dateOfInspection: inspectionDate,
      stakeholders: typeof data.stakeholders === 'string' ? JSON.parse(data.stakeholders) : data.stakeholders,
      coordinates: data.coordinates ? (typeof data.coordinates === 'string' ? JSON.parse(data.coordinates) : data.coordinates) : undefined,
      images: processedImages,
      submittedBy: req.user ? req.user.id : undefined,
      auditTrail: [{
        action: 'CREATED',
        performedBy: req.user ? req.user.username : 'Field Officer',
        details: `Inspection record ${referenceNumber} created.`
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Inspection submitted successfully',
      data: { referenceNumber: newInspection.referenceNumber, id: newInspection._id }
    });
  } catch (error) {
    next(error);
  }
};

exports.getInspections = async (req, res, next) => {
  try {
    const { search, quarter, inspectionType, supervisorId, status, startDate, endDate, page = 1, limit = 10 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { referenceNumber: { $regex: search,$options: 'i' } },
        { location: { $regex: search,$options: 'i' } },
        { identifiedIssues: { $regex: search,$options: 'i' } }
      ];
    }
    if (quarter) query.quarter = quarter;
    if (inspectionType) query.inspectionType = inspectionType;
    if (supervisorId) query.supervisorId = supervisorId;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.dateOfInspection = { $gte: new Date(startDate),$lte: new Date(endDate) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Inspection.countDocuments(query);
    const inspections = await Inspection.find(query)
      .populate('supervisorId', 'name email unit')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: inspections.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: inspections
    });
  } catch (error) {
    next(error);
  }
};

exports.getInspectionById = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id).populate('supervisorId');
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection record not found' });
    }
    res.json({ success: true, data: inspection });
  } catch (error) {
    next(error);
  }
};

exports.updateInspectionStatus = async (req, res, next) => {
  try {
    const { status, followUp } = req.body;
    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) return res.status(404).json({ success: false, message: 'Inspection not found' });

    inspection.status = status || inspection.status;
    if (followUp) inspection.followUp = followUp;

    inspection.auditTrail.push({
      action: 'STATUS_UPDATED',
      performedBy: req.user.username,
      details: `Status changed to ${inspection.status}`
    });

    await inspection.save();
    res.json({ success: true, message: 'Inspection status updated successfully', data: inspection });
  } catch (error) {
    next(error);
  }
};

exports.deleteInspection = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) return res.status(404).json({ success: false, message: 'Inspection not found' });

    for (let img of inspection.images) {
      if (img.publicId) await deleteImage(img.publicId);
    }

    await Inspection.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Inspection deleted successfully' });
  } catch (error) {
    next(error);
  }
};