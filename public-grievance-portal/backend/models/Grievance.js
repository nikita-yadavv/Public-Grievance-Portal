const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please enter a grievance title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    category: {
      type: String,
      required: [true, 'Please select a department category'],
      enum: ['Roads & Infrastructure', 'Water Supply', 'Electricity & Power', 'Sanitation & Waste', 'Public Safety', 'Other']
    },
    description: {
      type: String,
      required: [true, 'Please enter a detailed description'],
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    location: {
      type: String,
      required: [true, 'Please specify the location of the issue'],
      trim: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending'
    },
    adminRemarks: {
      type: String,
      default: 'Awaiting official review.'
    },
    // Tracks which officer last updated or resolved this complaint
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastUpdatedDate: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Grievance', grievanceSchema);
