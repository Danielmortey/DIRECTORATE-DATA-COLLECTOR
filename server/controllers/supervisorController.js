const Supervisor = require('../models/Supervisor');

exports.getSupervisors = async (req, res, next) => {
  try {
    const supervisors = await Supervisor.find({ active: true }).sort({ name: 1 });
    res.json({ success: true, data: supervisors });
  } catch (error) {
    next(error);
  }
};

exports.createSupervisor = async (req, res, next) => {
  try {
    const supervisor = await Supervisor.create(req.body);
    res.status(201).json({ success: true, message: 'Supervisor added successfully', data: supervisor });
  } catch (error) {
    next(error);
  }
};

exports.updateSupervisor = async (req, res, next) => {
  try {
    const supervisor = await Supervisor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Supervisor updated', data: supervisor });
  } catch (error) {
    next(error);
  }
};

exports.deleteSupervisor = async (req, res, next) => {
  try {
    await Supervisor.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true, message: 'Supervisor deactivated' });
  } catch (error) {
    next(error);
  }
};