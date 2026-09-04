import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, X, Check, AlertCircle } from 'lucide-react';
import API from '../services/api';

/**
 * EditProfileModal Component
 * Allows Citizens and Admins to edit their personal profile information independently.
 */
const EditProfileModal = ({ isOpen, onClose, currentUser, onProfileUpdated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Whenever modal opens or currentUser changes, populate with current user's data
  useEffect(() => {
    if (isOpen && currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPassword('');
      setMessage({ type: '', text: '' });
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <User size={20} />
            <h3>Edit {currentUser?.role === 'admin' ? 'Officer' : 'Citizen'} Profile</h3>
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

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
