import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import API from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      if (data?.isEmailUnverified) {
        setError('📧 Email not verified. Please check your inbox and click the verification link before signing in.');
      } else if (data?.isPendingApproval) {
        setError('⏳ Your officer account is pending approval by the Chief Municipal Officer.');
      } else {
        setError(data?.message || 'Sign in failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
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
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                name="email"
                placeholder="name@domain.com"
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
    </div>
  );
};

export default Login;
