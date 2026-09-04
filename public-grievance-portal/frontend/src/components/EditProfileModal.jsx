import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, X, Check, AlertCircle, Trash2, AlertTriangle } from 'lucide-react';
import API from '../services/api';

/**
 * EditProfileModal Component
 * Allows Citizens and Admins to edit their personal profile information independently,
 * and provide an option to delete their profile.
 */
const EditProfileModal = ({ isOpen, onClose, currentUser, onProfileUpdated }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Whenever modal opens or currentUser changes, populate with current user's data
  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPassword('');
      setMessage({ type: '', text: '' });
      setShowConfirmDelete(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = { name, email };
      if (password.trim()) {
        payload.password = password;
      }

      const res = await API.put('/auth/profile', payload);

      if (res.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });

        // Update local storage with the new user object
        const stored = JSON.parse(localStorage.getItem('grievance_user') || '{}');
        const updatedUser = {
          ...stored.user,
          name: res.data.user.name,
          email: res.data.user.email
        };
        stored.user = updatedUser;
        localStorage.setItem('grievance_user', JSON.stringify(stored));

        if (onProfileUpdated) {
          onProfileUpdated(updatedUser);
        }

        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await API.delete('/auth/profile');
      if (res.data.success) {
        localStorage.removeItem('grievance_user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onClose();
        navigate('/login');
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete account'
      });
      setDeleteLoading(false);
    }
  };

  const isChiefOfficer = currentUser?.role === 'superadmin';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <User size={20} />
            <h3>Edit {currentUser?.role === 'admin' ? 'Officer' : currentUser?.role === 'superadmin' ? 'Chief Officer' : 'Citizen'} Profile</h3>
          </div>
          <button onClick={onClose} className="btn-close" title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {message.text && (
            <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}>
              {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>New Password (leave blank to keep current)</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password (optional)"
                  minLength={6}
                />
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </form>

          {/* DANGER ZONE: DELETE PROFILE */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #fee2e2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Trash2 size={16} /> Delete Account
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '2px 0 0 0' }}>
                  {isChiefOfficer
                    ? 'The Chief Municipal Officer account cannot be deleted for administrative continuity.'
                    : 'Permanently remove your account and all associated profile data.'}
                </p>
              </div>

              {!isChiefOfficer && !showConfirmDelete && (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Delete Account
                </button>
              )}
            </div>

            {showConfirmDelete && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.82rem', color: '#991b1b', fontWeight: 600 }}>
                    Are you sure? This will permanently delete your account and cannot be undone.
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="btn btn-sm btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
