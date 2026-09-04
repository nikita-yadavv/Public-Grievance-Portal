import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, AlertCircle, Sparkles, KeyRound, X, RefreshCw } from 'lucide-react';
import API from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification prompt modal state if unverified
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyData, setVerifyData] = useState({ email: '', phone: '', otp: '' });
  const [enteredCode, setEnteredCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [resending, setResending] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await API.post('/auth/login', formData);
      if (res.data.success) {
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
      const data = err.response?.data;
      if (data?.needsVerification) {
        setVerifyData({
          email: data.email || formData.email,
          phone: data.phone || '',
          otp: data.otp || ''
        });
        setEnteredCode('');
        setVerifyError('');
        setShowVerifyModal(true);
      } else if (data?.isPendingApproval) {
        setError('⏳ Your officer account is pending approval by the Chief Municipal Officer.');
      } else {
        setError(data?.message || 'Sign in failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit Verification Code from Login Modal
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!enteredCode || enteredCode.trim().length < 6) {
      setVerifyError('Please enter the 6-digit verification code.');
      return;
    }

    setVerifyLoading(true);
    setVerifyError('');

    try {
      const res = await API.post('/auth/verify-code', {
        identifier: verifyData.email,
        code: enteredCode.trim()
      });

      if (res.data.success) {
        if (res.data.isPendingApproval) {
          setShowVerifyModal(false);
          setError('⏳ Account verified! Officer accounts are awaiting approval from the Chief Municipal Officer.');
          return;
        }

        localStorage.setItem(
          'grievance_user',
          JSON.stringify({
            token: res.data.token,
            user: res.data.user
          })
        );

        setShowVerifyModal(false);

        if (res.data.user?.role === 'admin' || res.data.user?.role === 'superadmin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Resend code from login modal
  const handleResendCode = async () => {
    setResending(true);
    setVerifyError('');
    try {
      const res = await API.post('/auth/resend-code', {
        identifier: verifyData.email
      });
      if (res.data.success) {
        setVerifyData((prev) => ({
          ...prev,
          otp: res.data.otp || prev.otp
        }));
        alert(`A new verification code has been dispatched to ${verifyData.email}`);
      }
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  // Quick-fill helper for demo accounts
  const fillDemo = (type) => {
    switch (type) {
      case 'chief':
        setFormData({ email: 'chief@citygov.org', password: 'adminpassword123' });
        break;
      case 'approved_officer':
        setFormData({ email: 'rajesh.officer@citygov.org', password: 'password123' });
        break;
      case 'pending_officer':
        setFormData({ email: 'priya.officer@citygov.org', password: 'password123' });
        break;
      case 'citizen':
      default:
        setFormData({ email: 'citizen@example.com', password: 'password123' });
        break;
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <LogIn size={26} />
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to file grievances or access the municipal dashboard</p>
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Phone Number or Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="text"
                name="email"
                placeholder="e.g. 9876543210 or name@domain.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-credentials-box">
          <div className="demo-title">
            <Sparkles size={14} />
            <span>Quick Fill for Exam Evaluation:</span>
          </div>
          <div className="demo-grid-2x2">
            <button type="button" onClick={() => fillDemo('citizen')} className="btn-demo">
              Citizen (Nikita)
            </button>
            <button type="button" onClick={() => fillDemo('chief')} className="btn-demo btn-demo-chief">
              Chief Officer (Approver)
            </button>
            <button type="button" onClick={() => fillDemo('approved_officer')} className="btn-demo">
              Approved Officer (Rajesh)
            </button>
            <button type="button" onClick={() => fillDemo('pending_officer')} className="btn-demo btn-demo-pending">
              Pending Officer (Priya)
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <span>Don't have an account? </span>
          <Link to="/register">Create an Account</Link>
        </div>
      </div>

      {/* VERIFICATION REQUIRED MODAL */}
      {showVerifyModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <KeyRound size={20} />
                <h3>Activate Your Account</h3>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="btn-close" title="Close">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: '#4b5563', marginBottom: '14px', lineHeight: 1.5 }}>
                Your account requires activation. We dispatched a 6-digit code to <strong>{verifyData.email}</strong>.
              </p>

              {verifyError && (
                <div className="alert-error" style={{ marginBottom: '12px' }}>
                  <AlertCircle size={16} />
                  <span style={{ fontSize: '0.84rem' }}>{verifyError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="modal-form">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ textAlign: 'center', display: 'block', fontSize: '0.85rem', fontWeight: 700 }}>
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    style={{
                      textAlign: 'center',
                      fontSize: '1.6rem',
                      letterSpacing: '8px',
                      fontWeight: 800,
                      color: '#4c1d95',
                      padding: '10px'
                    }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={verifyLoading || enteredCode.length < 6}
                >
                  {verifyLoading ? 'Verifying...' : 'Verify & Sign In'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(false)}
                    style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resending}
                    style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RefreshCw size={13} className={resending ? 'spin' : ''} />
                    <span>{resending ? 'Sending...' : 'Resend Code'}</span>
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

export default Login;
