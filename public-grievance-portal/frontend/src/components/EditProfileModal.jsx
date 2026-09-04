import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, X, Check, AlertCircle, Trash2, AlertTriangle, Edit3, ShieldCheck, Building2, Calendar } from 'lucide-react';
import API from '../services/api';

/**
 * EditProfileModal Component
 * Two Distinct Modes:
 * 1. 'view' (My Profile): Displays user details, verification status, and account information.
 * 2. 'edit' (Edit Profile): Allows editing name, email, phone, and password.
 */
const EditProfileModal = ({ isOpen, onClose, currentUser, onProfileUpdated }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('view'); // 'view' | 'edit'
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

  // Reset to view mode whenever modal opens and populate fresh user info
  useEffect(() => {
    if (isOpen) {
      setMode('view');
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

      // Fetch latest profile state from backend
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

        const stored = JSON.parse(localStorage.getItem('grievance_user') || '{}');
        const updatedUser = {
          ...stored.user,
          name: res.data.user.name,
          email: res.data.user.email,
          phone: res.data.user.phone || phone
        };
        stored.user = updatedUser;
        localStorage.setItem('grievance_user', JSON.stringify(stored));
        setProfileUser(updatedUser);

        if (onProfileUpdated) {
          onProfileUpdated(updatedUser);
        }

        // Return to view mode after saving
        setTimeout(() => {
          setMode('view');
          setMessage({ type: '', text: '' });
        }, 800);
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

  const isChiefOfficer = profileUser?.role === 'superadmin';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="modal-header">
          <div className="modal-title">
            {mode === 'view' ? <User size={20} /> : <Edit3 size={20} />}
            <h3>{mode === 'view' ? 'My Profile' : 'Edit Profile'}</h3>
          </div>
          <button onClick={onClose} className="btn-close" title="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {message.text && (
            <div className={message.type === 'success' ? 'alert-success' : 'alert-error'} style={{ marginBottom: '16px' }}>
              {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
              <span>{message.text}</span>
            </div>
          )}

          {/* MODE 1: VIEW PROFILE ("MY PROFILE") */}
          {mode === 'view' && (
            <div>
              {/* Profile Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#faf5ff', border: '1px solid #ede9fe', borderRadius: '12px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                    flexShrink: 0
                  }}
                >
                  {(profileUser?.name || 'U').charAt(0).toUpperCase()}
                </div>

                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: '#1e1b4b', fontWeight: 800 }}>
                    {profileUser?.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={`role-pill role-${profileUser?.role}`}>
                      {profileUser?.role === 'superadmin' ? 'CHIEF OFFICER' : profileUser?.role === 'admin' ? 'OFFICER' : 'CITIZEN'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {profileUser?.department || 'General Administration'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                {/* Email Item */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail size={18} style={{ color: '#6d28d9' }} />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Email Address</span>
                      <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{profileUser?.email}</strong>
                    </div>
                  </div>
                  <div>
                    {profileUser?.isEmailVerified ? (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '3px 9px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={11} /> Verified
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '3px 9px', borderRadius: '999px' }}>
                        Unverified
                      </span>
                    )}
                  </div>
                </div>

                {/* Phone Item */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Phone size={18} style={{ color: '#6d28d9' }} />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Mobile Number</span>
                      <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                        {profileUser?.phone ? `+91 ${profileUser.phone}` : 'Not provided'}
                      </strong>
                    </div>
                  </div>
                  <div>
                    {profileUser?.phone ? (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '3px 9px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={11} /> Verified
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Optional</span>
                    )}
                  </div>
                </div>

                {/* Department Item */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <Building2 size={18} style={{ color: '#6d28d9' }} />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Department / Jurisdiction</span>
                    <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{profileUser?.department || 'General Public'}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons in View Mode */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '0.88rem', fontWeight: 700 }}
                >
                  <Edit3 size={15} />
                  <span>Edit Profile</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: EDIT PROFILE FORM */}
          {mode === 'edit' && (
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
                <label>Phone Number (for SMS notifications)</label>
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
                <button
                  type="button"
                  onClick={() => setMode('view')}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}

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
