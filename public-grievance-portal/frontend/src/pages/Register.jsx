import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Phone, Lock, ShieldCheck, Building2, AlertCircle, CheckCircle2, Info, X, KeyRound } from 'lucide-react';
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
  const [verificationUrl, setVerificationUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

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

  // Step 1: When user submits registration form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setVerificationUrl('');
    setPreviewUrl('');

    // If phone number provided, send OTP and pop up OTP verification modal
    if (formData.phone && formData.phone.trim().length >= 10) {
      setLoading(true);
      try {
        const otpRes = await API.post('/auth/send-otp', { phone: formData.phone.trim() });
        if (otpRes.data.success) {
          setDemoOtp(otpRes.data.otp || '');
          setEnteredOtp('');
          setOtpError('');
          setShowOtpModal(true);
        }
      } catch (otpErr) {
        setError(otpErr.response?.data?.message || 'Failed to dispatch verification OTP. You can proceed without phone verification.');
      } finally {
        setLoading(false);
      }
    } else {
      // If no valid phone number, register directly
      executeRegistration(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!enteredOtp || enteredOtp.trim().length < 4) {
      setOtpError('Please enter the 6-digit verification OTP code.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const res = await API.post('/auth/verify-otp', {
        phone: formData.phone.trim(),
        otp: enteredOtp.trim()
      });

      if (res.data.success) {
        setIsPhoneVerified(true);
        setShowOtpModal(false);
        // Complete registration with verified phone
        await executeRegistration(true);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 2 (Alternative): Skip OTP and register directly
  const handleSkipOtp = async () => {
    setShowOtpModal(false);
    await executeRegistration(false);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await API.post('/auth/send-otp', { phone: formData.phone.trim() });
      if (res.data.success) {
        setDemoOtp(res.data.otp || '');
        setOtpError('');
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 3: Execute Registration API call
  const executeRegistration = async (phoneVerifiedStatus = false) => {
    setLoading(true);
    setError('');

    try {
      const res = await API.post('/auth/register', {
        ...formData,
        isPhoneVerified: phoneVerifiedStatus
      });

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

        // Store user and token if provided
        if (res.data.token) {
          localStorage.setItem(
            'grievance_user',
            JSON.stringify({
              token: res.data.token,
              user: res.data.user
            })
          );
        }

        setSuccessMsg(res.data.message || 'Account registered successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <CheckCircle2 size={44} style={{ color: '#10b981', margin: '0 auto 10px auto' }} />
            <div>
              <strong style={{ fontSize: '1.25rem', display: 'block', marginBottom: '8px', color: '#065f46' }}>
                🎉 Account Registered Successfully!
              </strong>
              <p style={{ fontSize: '0.92rem', color: '#4b5563', marginBottom: '1.25rem' }}>
                {formData.role === 'admin'
                  ? 'Officer registration submitted! After review, the Chief Municipal Officer will approve your access.'
                  : 'Your account is active! You can sign in using your Phone Number or Email.'}
              </p>

              {isPhoneVerified && (
                <div style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#d1fae5', color: '#065f46', padding: '4px 12px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 700 }}>
                  <CheckCircle2 size={14} /> Phone Number Verified (+91 {formData.phone})
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <Link
                  to={formData.role === 'admin' ? '/login' : '/dashboard'}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontWeight: 700, fontSize: '0.95rem' }}
                >
                  {formData.role === 'admin' ? 'Proceed to Sign In' : 'Go to Dashboard'}
                </Link>
              </div>

              {verificationUrl && (
                <div style={{ borderTop: '1px solid #ede9fe', paddingTop: '1rem', marginTop: '1rem', textAlign: 'left', background: '#fbf9ff', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Mail size={16} style={{ color: '#7c3aed' }} />
                    <strong style={{ fontSize: '0.85rem', color: '#4c1d95' }}>Email Verification (Optional):</strong>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0 0 8px 0' }}>
                    Verify your email now to receive instant updates whenever municipal officers resolve your grievances:
                  </p>
                  <a
                    href={verificationUrl}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'inline-block' }}
                  >
                    ✉️ Verify Email Address Now
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ margin: 0 }}>Phone Number (OTP Verification on submit)</label>
                <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>SMS / Sign In</span>
              </div>
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
              {loading ? 'Processing Registration...' : `Register as ${formData.role === 'admin' ? 'Officer (Pending Approval)' : 'Citizen'}`}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <span>Already registered? </span>
          <Link to="/login">Sign in here</Link>
        </div>
      </div>

      {/* INTERACTIVE PHONE OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <KeyRound size={20} />
                <h3>Mobile Verification (OTP)</h3>
              </div>
              <button onClick={() => setShowOtpModal(false)} className="btn-close" title="Close">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '14px', lineHeight: 1.5 }}>
                We sent a 6-digit one-time password to <strong>+91 {formData.phone}</strong>. Enter it below to verify your phone number.
              </p>

              {/* Quick Examiner Demo Box */}
              {demoOtp && (
                <div
                  style={{
                    background: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#6d28d9', fontWeight: 600, display: 'block' }}>
                      💡 Examiner / Demo Code:
                    </span>
                    <strong style={{ fontSize: '1.25rem', letterSpacing: '3px', color: '#4c1d95' }}>
                      {demoOtp}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnteredOtp(demoOtp)}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {otpError && (
                <div className="alert-error" style={{ marginBottom: '12px' }}>
                  <AlertCircle size={16} />
                  <span style={{ fontSize: '0.85rem' }}>{otpError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="modal-form">
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label style={{ textAlign: 'center', display: 'block', fontSize: '0.85rem' }}>
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    style={{
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      letterSpacing: '8px',
                      fontWeight: 800,
                      color: '#4c1d95',
                      padding: '10px'
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpLoading}
                    style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipOtp}
                    style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Skip & Register Directly →
                  </button>
                </div>

                <div className="modal-actions" style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={otpLoading || enteredOtp.length < 6}
                    style={{ flex: 2 }}
                  >
                    {otpLoading ? 'Verifying...' : 'Verify OTP & Finish'}
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

export default Register;
