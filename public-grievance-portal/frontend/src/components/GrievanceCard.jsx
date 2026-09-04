import React from 'react';
import { MapPin, Clock, MessageSquare, Tag, UserCheck, Shield } from 'lucide-react';

const GrievanceCard = ({ grievance, onStatusUpdate, isAdmin = false }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'In Progress': return 'status-in-progress';
      case 'Resolved': return 'status-resolved';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Urgent': return 'priority-urgent';
      case 'High': return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low': return 'priority-low';
      default: return '';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="grievance-card">
      <div className="card-header">
        <div className="category-tag">
          <Tag size={14} />
          <span>{grievance.category}</span>
        </div>
        <div className="badge-group">
          <span className={`priority-badge ${getPriorityClass(grievance.priority)}`}>
            {grievance.priority} Priority
          </span>
          <span className={`status-badge ${getStatusClass(grievance.status)}`}>
            {grievance.status}
          </span>
        </div>
      </div>

      <h3 className="grievance-title">{grievance.title}</h3>
      <p className="grievance-desc">{grievance.description}</p>

      <div className="meta-info">
        <div className="meta-item">
          <MapPin size={14} />
          <span>{grievance.location}</span>
        </div>
        <div className="meta-item">
          <Clock size={14} />
          <span>{formatDate(grievance.createdAt)}</span>
        </div>
      </div>

      {grievance.user && (
        <div className="citizen-info">
          <span>Submitted by: <strong>{grievance.user.name || 'Citizen'}</strong> ({grievance.user.email})</span>
        </div>
      )}

      {/* Official Remarks */}
      {grievance.adminRemarks && (
        <div className="admin-remarks-box">
          <div className="remarks-header">
            <MessageSquare size={14} />
            <span>Official Resolution Remarks:</span>
          </div>
          <p className="remarks-text">{grievance.adminRemarks}</p>
        </div>
      )}

      {/* Officer Audit Trail */}
      {grievance.updatedBy && (
        <div className="officer-audit-tag">
          <UserCheck size={14} />
          <span>
            Handled by: <strong>{grievance.updatedBy.name}</strong> ({grievance.updatedBy.department || 'Municipal Officer'})
          </span>
        </div>
      )}

      {isAdmin && (
        <div className="card-admin-action">
          <button
            onClick={() => onStatusUpdate(grievance)}
            className="btn btn-outline-primary btn-sm"
          >
            Update Status & Remarks
          </button>
        </div>
      )}
    </div>
  );
};

export default GrievanceCard;
