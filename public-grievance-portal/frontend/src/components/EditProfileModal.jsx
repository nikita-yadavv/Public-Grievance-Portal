import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, X, Check, AlertCircle, Trash2, AlertTriangle } from 'lucide-react';
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
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifyMsg, setEmailVerifyMsg] = useState('');
  const [emailVerifyUrl, setEmailVerifyUrl] = useState('');
  const [profileUser, setProfileUser] = useState(currentUser);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Whenever modal opens, refresh profile from backend and initialize form
  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setProfileUser(currentUser);
        setName(currentUser.name || '');
        setEmail(currentUser.email || '');
        setPhone(currentUser.phone || '');
      }
      setPassword('');
      setMessage({ type: '', text: '' });
      setEmailVerifyMsg('');
      setEmailVerifyUrl('');
      setShowConfirmDelete(false);

      // Fetch fresh status from backend
      API.get('/auth/me')
        .then((res) => {
          if (res.data.success && res.data.user) {
            setProfileUser(res.data.user);
            setName(res.data.user.name || '');
            setEmail(res.data.user.email || '');
            setPhone(res.data.user.phone || '');
          }
        })
        .catch(() => {});
    }
  }, [isOpen, currentUser]);

  const handleSendEmailVerification = async () => {
    setEmailSending(true);
    setEmailVerifyMsg('');
    setEmailVerifyUrl('');

    try {
      const res = await API.post('/auth/send-verification-email');
      if (res.data.success) {
        setEmailVerifyMsg(res.data.message || 'Verification link dispatched to your email.');
        if (res.data.verificationUrl) {
          setEmailVerifyUrl(res.data.verificationUrl);
        }
      }
    } catch (err) {
      setEmailVerifyMsg(err.response?.data?.message || 'Failed to send verification email.');
    } finally {
      setEmailSending(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = { name, email, phone };
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
          email: res.data.user.email,
          phone: res.data.user.phone || phone
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ margin: 0 }}>Email Address</label>
                {profileUser?.isEmailVerified ? (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} /> Verified
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: '999px' }}>
                    Unverified
                  </span>
                )}
              </div>
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

              {!profileUser?.isEmailVerified && (
                <div style={{ marginTop: '8px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                      Verify your email to receive live grievance status updates.
                    </span>
                    <button
                      type="button"
                      onClick={handleSendEmailVerification}
                      disabled={emailSending}
                      className="btn"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#7c3aed', color: '#ffffff', fontWeight: 600, borderRadius: '6px' }}
                    >
                      {emailSending ? 'Sending...' : '✉️ Send Verification Link'}
                    </button>
                  </div>

                  {emailVerifyMsg && (
                    <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#059669', background: '#ecfdf5', padding: '6px 10px', borderRadius: '6px' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{emailVerifyMsg}</p>
                      {emailVerifyUrl && (
                        <div style={{ marginTop: '6px' }}>
                          <a
                            href={emailVerifyUrl}
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: '0.75rem', padding: '3px 10px', display: 'inline-block' }}
                          >
                            ⚡ Click Here to Verify Email Now
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Phone Number (for sign in)</label>
              <div className="input-with-icon">
                <Phone size={18} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
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
