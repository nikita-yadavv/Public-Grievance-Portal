const Grievance = require('../models/Grievance');
const { sendGrievanceStatusUpdateEmail } = require('../utils/emailService');

// POST /api/grievances
const createGrievance = async (req, res) => {
  try {
    const { title, category, description, location, priority } = req.body;

    if (!title || !category || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, category, description, and location'
      });
    }

    const grievance = await Grievance.create({
      user: req.user._id,
      title,
      category,
      description,
      location,
      priority: priority || 'Medium',
      status: 'Pending'
    });

    res.status(201).json({ success: true, message: 'Grievance submitted successfully', grievance });
  } catch (error) {
    console.error('[Create Grievance Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating grievance' });
  }
};

// GET /api/grievances/my
const getMyGrievances = async (req, res) => {
  try {
    const grievances = await Grievance.find({ user: req.user._id })
      .populate('updatedBy', 'name email role department')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: grievances.length, grievances });
  } catch (error) {
    console.error('[Get My Grievances Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error fetching grievances' });
  }
};

// GET /api/grievances  (admin — supports ?category, ?status, ?search query params)
const getAllGrievances = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    let query = {};

    if (category && category !== 'All') query.category = category;
    if (status && status !== 'All') query.status = status;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const grievances = await Grievance.find(query)
      .populate('user', 'name email')
      .populate('updatedBy', 'name email role department')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: grievances.length, grievances });
  } catch (error) {
    console.error('[Get All Grievances Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error fetching grievances' });
  }
};

// GET /api/grievances/:id
const getGrievanceById = async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate('user', 'name email')
      .populate('updatedBy', 'name email role department');

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    // Citizens can only view their own grievances
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      grievance.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this grievance' });
    }

    res.status(200).json({ success: true, grievance });
  } catch (error) {
    console.error('[Get Grievance By ID Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error fetching grievance' });
  }
};

// PATCH /api/grievances/:id/status  (admin only)
const updateGrievanceStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;

    const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    if (status) grievance.status = status;
    if (adminRemarks) grievance.adminRemarks = adminRemarks;

    // Track which officer made the update
    grievance.updatedBy = req.user._id;
    grievance.lastUpdatedDate = new Date();

    const updatedGrievance = await grievance.save();
    const populated = await Grievance.findById(updatedGrievance._id)
      .populate('user', 'name email')
      .populate('updatedBy', 'name email role department');

    // Notify citizen by email if their email is available
    if (populated.user && populated.user.email) {
      sendGrievanceStatusUpdateEmail(
        populated.user.email,
        populated.user.name,
        populated,
        req.user
      ).catch((err) => console.error('[Notification Email Error]:', err.message));
    }

    res.status(200).json({ success: true, message: 'Grievance status updated successfully', grievance: populated });
  } catch (error) {
    console.error('[Update Status Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error updating status' });
  }
};

// GET /api/grievances/stats  (admin only)
const getGrievanceStats = async (req, res) => {
  try {
    const [total, pending, inProgress, resolved, rejected] = await Promise.all([
      Grievance.countDocuments(),
      Grievance.countDocuments({ status: 'Pending' }),
      Grievance.countDocuments({ status: 'In Progress' }),
      Grievance.countDocuments({ status: 'Resolved' }),
      Grievance.countDocuments({ status: 'Rejected' })
    ]);

    res.status(200).json({ success: true, stats: { total, pending, inProgress, resolved, rejected } });
  } catch (error) {
    console.error('[Stats Error]:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error fetching statistics' });
  }
};

module.exports = {
  createGrievance,
  getMyGrievances,
  getAllGrievances,
  getGrievanceById,
  updateGrievanceStatus,
  getGrievanceStats
};
