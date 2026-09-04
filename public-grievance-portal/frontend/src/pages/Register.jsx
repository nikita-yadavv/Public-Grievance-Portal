import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Phone, Lock, ShieldCheck, Building2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import API from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'citizen',
    department: 'Water Supply Department'
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const departments = [
    'Water Supply Department',
    'Roads & Infrastructure',
    'Electricity & Power',
    'Sanitation & Solid Waste',
    'Public Safety & Health',
    'General Administration'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setVerificationUrl('');
    setPreviewUrl('');

    try {
      const res = await API.post('/auth/register', formData);
      if (res.data.success) {
        if (res.data.verificationUrl) {
          setVerificationUrl(res.data.verificationUrl);
        }
        if (res.data.previewUrl) {
          setPreviewUrl(res.data.previewUrl);
        }

        if (res.data.isPendingApproval) {
          setSuccessMsg(res.data.message);
          setLoading(false);
          return;
        }

        if (res.data.needsVerification) {
          setSuccessMsg(res.data.message);
          setLoading(false);
          return;
        }

        // Fallback
        localStorage.setItem(
          'grievance_user',
          JSON.stringify({
            token: res.data.token,
            user: res.data.user
          })
        );

        if (res.data.user.role === 'admin' || res.data.user.role === 'superadmin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [verificationUrl, setVerificationUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <UserPlus size={26} />
          </div>
          <h2>Create an Account</h2>
          <p>Register as a citizen to file grievances or as a municipal officer</p>
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-success-box" style={{ textAlign: 'center', padding: '1.75rem 1rem' }}>
            <CheckCircle2 size={40} style={{ color: '#10b981', margin: '0 auto 10px auto' }} />
            <div>
              <strong style={{ fontSize: '1.25rem', display: 'block', marginBottom: '8px' }}>
                🎉 Account Registered Successfully!
              </strong>
              <p style={{ fontSize: '0.92rem', color: '#4b5563', marginBottom: '1.25rem' }}>
                {formData.role === 'admin'
                  ? 'Officer registration submitted! After review, the Chief Municipal Officer will approve your access.'
                  : 'You can now sign in immediately using your Phone Number or Email.'}
              </p>

              <div style={{ marginBottom: '1.25rem' }}>
                <Link
                  to="/login"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontWeight: 700, fontSize: '0.95rem' }}
                >
                  Proceed to Sign In
                </Link>
              </div>

              {verificationUrl && (
                <div style={{ borderTop: '1px solid #ede9fe', paddingTop: '1rem', marginTop: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '8px' }}>
                    Email verification is optional, but if you wish to verify your email address:
                  </p>
                  <a
                    href={verificationUrl}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                  >
                    ✉️ Verify Email Now (Optional)
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={18} />
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Nikita Sharma"
                  value={formData.name}
                  onChange={handleChange}
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
                  name="email"
                  placeholder="nikita@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number (for sign in & notifications)</label>
              <div className="input-with-icon">
                <Phone size={18} />
                <input
                  type="tel"
                  name="phone"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password (minimum 6 characters)</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Account Type</label>
              <div className="input-with-icon">
                <ShieldCheck size={18} />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="select-input"
                >
                  <option value="citizen">Citizen (General Public - Instant Access)</option>
                  <option value="admin">Municipal Departmental Officer (Requires Chief Approval)</option>
                </select>
              </div>
            </div>

            {formData.role === 'admin' && (
              <div className="admin-key-section">
                <div className="form-group">
                  <label className="label-highlight">
                    <span>Assigned Municipal Department *</span>
                  </label>
                  <div className="input-with-icon">
                    <Building2 size={18} />
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-key-hint">
                  <Info size={15} />
                  <span>
                    Officer accounts require approval from the <strong>Chief Municipal Commissioner</strong> before granting admin portal access.
                  </span>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Submitting Application...' : `Register as ${formData.role === 'admin' ? 'Officer (Pending Approval)' : 'Citizen'}`}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <span>Already registered? </span>
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
