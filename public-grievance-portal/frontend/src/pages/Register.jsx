import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Phone, Lock, ShieldCheck, Building2, AlertCircle, CheckCircle2, Info, KeyRound, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
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

  const [step, setStep] = useState('form'); // 'form' | 'verify' | 'pending_approval'
  const [verificationData, setVerificationData] = useState({ email: '', phone: '', otp: '' });
  const [enteredCode, setEnteredCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

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
  };

  // Step 1: Submit Registration Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/register', formData);
      if (res.data.success) {
        setVerificationData({
          email: res.data.email || formData.email,
          phone: res.data.phone || formData.phone,
          otp: res.data.otp || ''
        });
        setEnteredCode('');
        setStep('verify');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-Digit Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!enteredCode || enteredCode.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/verify-code', {
        identifier: verificationData.email,
        code: enteredCode.trim()
      });

      if (res.data.success) {
        if (res.data.isPendingApproval) {
          setSuccessMsg(res.data.message);
          setStep('pending_approval');
          return;
        }

        // Save authenticated citizen session
        localStorage.setItem(
          'grievance_user',
          JSON.stringify({
            token: res.data.token,
            user: res.data.user
          })
        );

        if (res.data.user?.role === 'admin' || res.data.user?.role === 'superadmin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend 6-Digit Code
  const handleResendCode = async () => {
    setResending(true);
    setError('');
    try {
      const res = await API.post('/auth/resend-code', {
        identifier: verificationData.email
      });
      if (res.data.success) {
        setVerificationData((prev) => ({
          ...prev,
          otp: res.data.otp || prev.otp
        }));
        alert(`A new verification code has been dispatched to ${verificationData.email}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* HEADER */}
        <div className="auth-header">
          <div className="auth-icon-circle">
            {step === 'verify' ? <KeyRound size={26} /> : <UserPlus size={26} />}
          </div>
          <h2>{step === 'verify' ? 'Account Verification' : 'Create an Account'}</h2>
          <p>
            {step === 'verify'
              ? 'Enter the 6-digit verification code dispatched to your email & phone'
              : 'Register as a citizen to file grievances or as a municipal officer'}
          </p>
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: REGISTRATION FORM */}
        {step === 'form' && (
          <form onSubmit={handleSubmitForm} className="auth-form">
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
              <label>Email Address (verification code will be sent here)</label>
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
              <label>Phone Number (for SMS notifications)</label>
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
                  <option value="citizen">Citizen (General Public Access)</option>
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
              {loading ? 'Submitting Registration...' : `Register & Send Verification Code`}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFICATION CODE REQUIRED */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyCode} className="auth-form">
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>
                Verification code dispatched to:
              </span>
              <strong style={{ fontSize: '0.9rem', color: '#1e293b', display: 'block' }}>
                ✉️ {verificationData.email}
              </strong>
              {verificationData.phone && (
                <span style={{ fontSize: '0.82rem', color: '#475569', display: 'block', marginTop: '2px' }}>
                  📱 +91 {verificationData.phone}
                </span>
              )}
            </div>

            <div className="form-group">
              <label style={{ textAlign: 'center', display: 'block', fontWeight: 700 }}>
                Enter 6-Digit Verification Code
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
                  letterSpacing: '10px',
                  fontWeight: 800,
                  color: '#4c1d95',
                  padding: '10px',
                  borderRadius: '10px'
                }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || enteredCode.length < 6}
            >
              {loading ? 'Activating Account...' : 'Verify Code & Activate Account'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="btn btn-sm"
                style={{ background: 'none', border: 'none', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.82rem' }}
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="btn btn-sm"
                style={{ background: 'none', border: 'none', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              >
                <RefreshCw size={13} className={resending ? 'spin' : ''} />
                <span>{resending ? 'Sending...' : 'Resend Code'}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: PENDING OFFICER APPROVAL */}
        {step === 'pending_approval' && (
          <div className="alert-success-box" style={{ textAlign: 'center', padding: '1.75rem 1rem' }}>
            <CheckCircle2 size={44} style={{ color: '#10b981', margin: '0 auto 10px auto' }} />
            <div>
              <strong style={{ fontSize: '1.25rem', display: 'block', marginBottom: '8px', color: '#065f46' }}>
                🎉 Account Verified Successfully!
              </strong>
              <p style={{ fontSize: '0.92rem', color: '#4b5563', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                {successMsg || 'Your email and phone have been verified! Officer registrations are subject to administrative approval by the Chief Municipal Officer before dashboard access is enabled.'}
              </p>
              <Link to="/login" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                Return to Sign In
              </Link>
            </div>
          </div>
        )}

        <div className="auth-footer">
          <span>Already have an account? </span>
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
