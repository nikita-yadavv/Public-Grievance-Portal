import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Edit3,
  X,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
  FileText
} from 'lucide-react';
import API from '../services/api';
import GrievanceCard from '../components/GrievanceCard';
import StatsCard from '../components/StatsCard';
import EmailVerificationBanner from '../components/EmailVerificationBanner';

/**
 * Admin Dashboard
 * Features:
 * 1. Grievance Management with Real-time Officer Audit Attribution
 * 2. Chief Officer Authorization Control (Approve/Reject New Municipal Officers)
 */
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('grievances'); // 'grievances' or 'officers'
  const [grievances, setGrievances] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [officersLoading, setOfficersLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal / Update Status State
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('grievance_user') || '{}')?.user || null;
    } catch {
      return null;
    }
  });

  const fetchUserProfile = async () => {
    try {
      const res = await API.get('/auth/me');
      if (res.data.success && res.data.user) {
        setCurrentUser(res.data.user);
        const stored = JSON.parse(localStorage.getItem('grievance_user') || '{}');
        stored.user = res.data.user;
        localStorage.setItem('grievance_user', JSON.stringify(stored));
      }
    } catch (err) {
      console.error('Error fetching officer profile:', err);
    }
  };

  const categories = [
    'Roads & Infrastructure',
    'Water Supply',
    'Electricity & Power',
    'Sanitation & Waste',
    'Public Safety',
    'Other'
  ];

  const statuses = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

  const fetchStats = async () => {
    try {
      const res = await API.get('/grievances/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchGrievances = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await API.get('/grievances', { params });
      if (res.data.success) {
        setGrievances(res.data.grievances);
      }
    } catch (err) {
      console.error('Error fetching grievances:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      setOfficersLoading(true);
      const res = await API.get('/auth/officers');
      if (res.data.success) {
        setOfficers(res.data.officers);
      }
    } catch (err) {
      console.error('Error fetching officers:', err);
    } finally {
      setOfficersLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchGrievances();
    fetchUserProfile();
    if (currentUser?.role === 'superadmin') {
      fetchOfficers();
    }
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGrievances();
  };

  const openUpdateModal = (grievance) => {
    setSelectedGrievance(grievance);
    setNewStatus(grievance.status);
    setRemarks(grievance.adminRemarks || '');
    setUpdateMessage('');
  };

  const closeUpdateModal = () => {
    setSelectedGrievance(null);
    setUpdateMessage('');
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await API.patch(`/grievances/${selectedGrievance._id}/status`, {
        status: newStatus,
        adminRemarks: remarks
      });

      if (res.data.success) {
        setUpdateMessage('Status updated successfully!');
        fetchGrievances();
        fetchStats();
        setTimeout(() => {
          closeUpdateModal();
        }, 1000);
      }
    } catch (err) {
      setUpdateMessage(err.response?.data?.message || 'Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  // Officer Approval Handlers
  const handleToggleOfficerApproval = async (officerId, currentStatus) => {
    try {
      const res = await API.patch(`/auth/officers/${officerId}/approve`, {
        isApproved: !currentStatus
      });
      if (res.data.success) {
        fetchOfficers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update officer status');
    }
  };

  const handleDeleteOfficer = async (officerId, officerName) => {
    if (!window.confirm(`Are you sure you want to reject and delete application for ${officerName}?`)) {
      return;
    }
    try {
      const res = await API.delete(`/auth/officers/${officerId}`);
      if (res.data.success) {
        fetchOfficers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete officer');
    }
  };

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const pendingOfficersCount = officers.filter(o => !o.isApproved).length;

  return (
    <div className="dashboard-container">
      {/* Email Verification Reminder Banner */}
      <EmailVerificationBanner currentUser={currentUser} onUserUpdated={(u) => setCurrentUser(u)} />

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Municipal Control Room</h1>
          <p>
            {isSuperAdmin ? 'Chief Commissioner Portal' : 'Departmental Officer Portal'} — Review grievances, update status & publish official resolutions.
          </p>
        </div>

        <div className="tab-buttons">
          <button
            onClick={() => setActiveTab('grievances')}
            className={`btn ${activeTab === 'grievances' ? 'btn-primary' : 'btn-outline'}`}
          >
            <FileText size={18} />
            <span>Grievances ({stats.total})</span>
          </button>

          {/* Only Super Admin (Chief Officer) can see & access Officer Approvals */}
          {isSuperAdmin && (
            <button
              onClick={() => { setActiveTab('officers'); fetchOfficers(); }}
              className={`btn ${activeTab === 'officers' ? 'btn-primary' : 'btn-outline'}`}
            >
              <Users size={18} />
              <span>Officer Approvals</span>
              {pendingOfficersCount > 0 && (
                <span className="badge-count-pending">{pendingOfficersCount}</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Analytics Metrics */}
      <div className="stats-grid">
        <StatsCard
          title="Total Submissions"
          count={stats.total}
          icon={BarChart3}
          colorClass="stats-primary"
        />
        <StatsCard
          title="Pending Action"
          count={stats.pending}
          icon={AlertTriangle}
          colorClass="stats-warning"
        />
        <StatsCard
          title="In Progress"
          count={stats.inProgress}
          icon={Clock}
          colorClass="stats-info"
        />
        <StatsCard
          title="Resolved"
          count={stats.resolved}
          icon={CheckCircle2}
          colorClass="stats-success"
        />
      </div>

      {/* TAB 1: Grievances Management */}
      {activeTab === 'grievances' && (
        <>
          <div className="admin-toolbar">
            <form onSubmit={handleSearchSubmit} className="search-form">
              <div className="input-with-icon search-input">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search complaints, locations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-secondary">Search</button>
            </form>

            <div className="filter-controls">
              <div className="filter-item">
                <Filter size={16} />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  {statuses.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <RefreshCw className="spin" size={32} />
              <p>Fetching complaints data...</p>
            </div>
          ) : grievances.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={48} />
              <h3>No Matching Complaints Found</h3>
              <p>Try adjusting your search query or department filter.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {grievances.map((grievance) => (
                <GrievanceCard
                  key={grievance._id}
                  grievance={grievance}
                  isAdmin={true}
                  onStatusUpdate={openUpdateModal}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: Municipal Officers & Approvals */}
      {activeTab === 'officers' && (
        <div className="officers-table-section">
          <div className="table-header-bar">
            <div>
              <h2>Municipal Officer Access Control</h2>
              <p>Chief Municipal Commissioner can approve new officer applications before they can access the administration portal.</p>
            </div>
            <button onClick={fetchOfficers} className="btn-refresh">
              <RefreshCw size={16} className={officersLoading ? 'spin' : ''} />
              <span>Refresh Officers</span>
            </button>
          </div>

          {officersLoading ? (
            <div className="loading-state">
              <RefreshCw className="spin" size={32} />
              <p>Loading officer accounts...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="officers-table">
                <thead>
                  <tr>
                    <th>Officer Name</th>
                    <th>Email Address</th>
                    <th>Department</th>
                    <th>Hierarchy Role</th>
                    <th>Approval Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.map((officer) => (
                    <tr key={officer._id}>
                      <td>
                        <strong>{officer.name}</strong>
                      </td>
                      <td>{officer.email}</td>
                      <td>
                        <span className="dept-tag">{officer.department || 'General Administration'}</span>
                      </td>
                      <td>
                        <span className={`role-pill ${officer.role === 'superadmin' ? 'role-admin' : 'role-citizen'}`}>
                          {officer.role === 'superadmin' ? 'CHIEF COMMISSIONER' : 'DEPARTMENT OFFICER'}
                        </span>
                      </td>
                      <td>
                        {officer.isApproved ? (
                          <span className="badge-approved">
                            <ShieldCheck size={14} /> Approved Active
                          </span>
                        ) : (
                          <span className="badge-pending-approval">
                            <Clock size={14} /> Pending Approval
                          </span>
                        )}
                      </td>
                      <td>
                        {officer.role === 'superadmin' ? (
                          <span className="text-muted-sm">Head Officer</span>
                        ) : (
                          <div className="action-button-group">
                            <button
                              onClick={() => handleToggleOfficerApproval(officer._id, officer.isApproved)}
                              className={`btn btn-sm ${officer.isApproved ? 'btn-outline-danger' : 'btn-primary'}`}
                              title={officer.isApproved ? 'Revoke Access' : 'Approve Officer'}
                            >
                              {officer.isApproved ? (
                                <>
                                  <UserX size={14} /> Revoke
                                </>
                              ) : (
                                <>
                                  <UserCheck size={14} /> Approve Access
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleDeleteOfficer(officer._id, officer.name)}
                              className="btn-icon-danger"
                              title="Delete Officer Application"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal for Updating Status & Remarks */}
      {selectedGrievance && (
        <div className="modal-overlay" onClick={closeUpdateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Edit3 size={20} />
                <h3>Update Grievance Status</h3>
              </div>
              <button onClick={closeUpdateModal} className="btn-close">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-grievance-info">
                <strong>Title:</strong> {selectedGrievance.title}
                <br />
                <strong>Citizen:</strong> {selectedGrievance.user?.name} ({selectedGrievance.user?.email})
                <br />
                <strong>Category:</strong> {selectedGrievance.category}
              </div>

              {updateMessage && (
                <div className={updateMessage.includes('success') ? 'alert-success' : 'alert-error'}>
                  {updateMessage}
                </div>
              )}

              <form onSubmit={handleStatusSubmit} className="modal-form">
                <div className="form-group">
                  <label>Change Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                  >
                    {statuses.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Official Resolution Remarks / Action Taken</label>
                  <textarea
                    rows="4"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Dispatched water works repair team. Leaking valve replaced and water line tested."
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={closeUpdateModal} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={updating}>
                    {updating ? 'Saving...' : 'Save & Publish Resolution'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
