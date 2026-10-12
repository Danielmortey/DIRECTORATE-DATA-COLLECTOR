const Inspection = require('../models/Inspection');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalInspections = await Inspection.countDocuments();
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const inspectionsThisMonth = await Inspection.countDocuments({ createdAt: { $gte: startOfMonth } });
    const inspectionsThisWeek = await Inspection.countDocuments({ createdAt: { $gte: startOfWeek } });
    const pendingFollowUp = await Inspection.countDocuments({ status: 'Follow-up Required' });
    const resolvedInspections = await Inspection.countDocuments({ status: 'Resolved' });

    const byQuarter = await Inspection.aggregate([
      { $group: { _id: '$quarter', count: { $sum: 1 } } }
    ]);

    const byType = await Inspection.aggregate([
      { $group: { _id: '$inspectionType', count: { $sum: 1 } } }
    ]);

    const bySupervisor = await Inspection.aggregate([
      { $group: { _id: '$supervisorName', count: { $sum: 1 } } }
    ]);

    const byLocation = await Inspection.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        kpis: {
          totalInspections,
          inspectionsThisMonth,
          inspectionsThisWeek,
          pendingFollowUp,
          resolvedInspections
        },
        charts: {
          byQuarter,
          byType,
          bySupervisor,
          byLocation
        }
      }
    });
  } catch (error) {
    next(error);
  }
};