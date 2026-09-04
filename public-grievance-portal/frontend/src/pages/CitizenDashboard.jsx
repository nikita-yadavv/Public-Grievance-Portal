import React, { useState, useEffect } from 'react';
import { PlusCircle, Clock, CheckCircle2, AlertTriangle, Send, RefreshCw, Filter, List } from 'lucide-react';
import API from '../services/api';
import GrievanceCard from '../components/GrievanceCard';
import StatsCard from '../components/StatsCard';

/**
 * Citizen Dashboard
 * Concepts Covered:
 * - Unit 4: Component Lifecycle / useEffect for fetching data, useState for list state & form state,
 *   conditional rendering, event handling, props passing to GrievanceCard.
 */
const CitizenDashboard = () => {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'new'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Roads & Infrastructure',
    description: '',
    location: '',
    priority: 'Medium'
  });

  const categories = [
    'Roads & Infrastructure',
    'Water Supply',
    'Electricity & Power',
    'Sanitation & Waste',
    'Public Safety',
    'Other'
  ];

  // Fetch Citizen Grievances
  const fetchMyGrievances = async () => {
    try {
      setLoading(true);
      const res = await API.get('/grievances/my');
      if (res.data.success) {
        setGrievances(res.data.grievances);
      }
    } catch (err) {
      console.error('Error fetching grievances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGrievances();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await API.post('/grievances', formData);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Your grievance has been lodged successfully!' });
        // Reset form
        setFormData({
          title: '',
          category: 'Roads & Infrastructure',
          description: '',
          location: '',
          priority: 'Medium'
        });
        // Refresh grievance list & switch tab
        fetchMyGrievances();
        setTimeout(() => {
          setActiveTab('list');
          setMessage({ type: '', text: '' });
        }, 1500);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit grievance. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics computation (Lifting/Deriving state in React)
  const totalCount = grievances.length;
  const pendingCount = grievances.filter((g) => g.status === 'Pending').length;
  const inProgressCount = grievances.filter((g) => g.status === 'In Progress').length;
  const resolvedCount = grievances.filter((g) => g.status === 'Resolved').length;

  const filteredGrievances = categoryFilter === 'All'
    ? grievances
    : grievances.filter((g) => g.category === categoryFilter);

  return (
    <div className="dashboard-container">
      {/* Page Header */}
      <div className="dashboard-header">
        <div>
          <h1>Citizen Grievance Portal</h1>
          <p>Lodge civic complaints, monitor departmental progress, and view resolution remarks.</p>
        </div>
        <div className="tab-buttons">
          <button
            onClick={() => setActiveTab('list')}
            className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-outline'}`}
          >
            <List size={18} />
            <span>My Grievances ({totalCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`btn ${activeTab === 'new' ? 'btn-primary' : 'btn-accent'}`}
          >
            <PlusCircle size={18} />
            <span>Lodge New Grievance</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="stats-grid">
        <StatsCard
          title="Total Filed"
          count={totalCount}
          icon={List}
          colorClass="stats-primary"
        />
        <StatsCard
          title="Pending Review"
          count={pendingCount}
          icon={AlertTriangle}
          colorClass="stats-warning"
        />
        <StatsCard
          title="In Progress"
          count={inProgressCount}
          icon={Clock}
          colorClass="stats-info"
        />
        <StatsCard
          title="Resolved"
          count={resolvedCount}
          icon={CheckCircle2}
          colorClass="stats-success"
        />
      </div>

      {/* Tab 1: Submit Form */}
      {activeTab === 'new' && (
        <div className="form-card">
          <div className="card-title-bar">
            <PlusCircle size={22} />
            <h2>Lodge a Civic Grievance</h2>
          </div>
          <p className="card-subtitle">
            Please provide accurate location and details to assist municipal officials in swift resolution.
          </p>

          {message.text && (
            <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="grievance-form">
            <div className="form-group">
              <label>Grievance Title *</label>
              <input
                type="text"
                name="title"
                placeholder="e.g. Broken Water Pipeline leaking near Sector 4"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Priority Level</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent / Emergency</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Specific Location / Landmark / Ward *</label>
              <input
                type="text"
                name="location"
                placeholder="e.g. Near Community Center, Street 12, Ward 5"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Detailed Description *</label>
              <textarea
                name="description"
                rows="4"
                placeholder="Describe the issue, how long it has persisted, and any relevant details..."
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                <Send size={18} />
                <span>{submitting ? 'Submitting...' : 'Submit Complaint'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Grievances List */}
      {activeTab === 'list' && (
        <div className="grievances-section">
          <div className="section-toolbar">
            <div className="filter-group">
              <Filter size={18} />
              <span>Filter by Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Categories ({totalCount})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button onClick={fetchMyGrievances} className="btn-refresh" title="Refresh List">
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <RefreshCw className="spin" size={32} />
              <p>Loading your grievances...</p>
            </div>
          ) : filteredGrievances.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={48} />
              <h3>No Grievances Found</h3>
              <p>
                {categoryFilter === 'All'
                  ? "You haven't filed any grievances yet. Click 'Lodge New Grievance' above to file one."
                  : `No grievances found in category "${categoryFilter}".`}
              </p>
              {categoryFilter === 'All' && (
                <button onClick={() => setActiveTab('new')} className="btn btn-primary">
                  Lodge Your First Grievance
                </button>
              )}
            </div>
          ) : (
            <div className="cards-grid">
              {filteredGrievances.map((grievance) => (
                <GrievanceCard key={grievance._id} grievance={grievance} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
