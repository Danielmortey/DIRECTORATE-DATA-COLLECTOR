const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema({
  referenceNumber: { type: String, required: true, unique: true, index: true },
  serialNumber: { type: Number, required: true },
  dateOfInspection: { type: Date, required: true, index: true },
  quarter: { type: String, required: true, enum: ['Q1', 'Q2', 'Q3', 'Q4'], index: true },
  inspectionType: { type: String, required: true, index: true },
  customInspectionType: { type: String },
  identifiedIssues: { type: String, required: true },
  location: { type: String, required: true, index: true },
  stakeholders: [{ type: String, required: true }],
  recommendations: { type: String, required: true },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supervisor', required: true, index: true },
  supervisorName: { type: String, required: true },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number },
    capturedAt: { type: Date }
  },
  images: [{
    url: { type: String, required: true },
    publicId: { type: String },
    filename: { type: String },
    caption: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  status: { 
    type: String, 
    enum: ['Submitted', 'Under Review', 'Follow-up Required', 'Resolved', 'Closed'], 
    default: 'Submitted',
    index: true 
  },
  followUp: {
    followUpDate: { type: Date },
    actionRequired: { type: String },
    responsiblePerson: { type: String },
    notes: { type: String },
    completionStatus: { type: Boolean, default: false }
  },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  auditTrail: [{
    action: String,
    performedBy: String,
    timestamp: { type: Date, default: Date.now },
    details: String
  }]
}, { timestamps: true });

inspectionSchema.index({ referenceNumber: 'text', location: 'text', identifiedIssues: 'text' });

module.exports = mongoose.model('Inspection', inspectionSchema);