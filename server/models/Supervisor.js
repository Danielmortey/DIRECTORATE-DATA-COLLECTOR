const mongoose = require('mongoose');

const supervisorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  unit: { type: String, required: true },
  phone: { type: String },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Supervisor', supervisorSchema);