import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { MailCheck, AlertCircle, Loader, CheckCircle2 } from 'lucide-react';
import API from '../services/api';

/**
 * VerifyEmail Page
 * Verifies the token from the email link and activates the account.
 */
const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error' | 'already'
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    // Guard against React 18 StrictMode double-execution
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided. Please use the link sent to your email.');
        return;
      }

      try {
        const res = await API.get(`/auth/verify-email?token=${token}`);
        if (res.data.success) {
          // Auto sign-in: save token and user in localStorage
          if (res.data.token && res.data.user) {
            localStorage.setItem(
              'grievance_user',
              JSON.stringify({
                token: res.data.token,
                user: res.data.user
              })
            );
          }

          setStatus('success');
          setMessage(res.data.message || 'Email verified successfully! Welcome to the portal.');

          // Redirect to appropriate dashboard after brief confirmation
          setTimeout(() => {
            const role = res.data.user?.role;
            if (role === 'admin' || role === 'superadmin') {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
          }, 1500);
        }
      } catch (err) {
        // If the user in localStorage is already verified, seamlessly redirect
        const stored = localStorage.getItem('grievance_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.user?.isEmailVerified) {
              setStatus('success');
              setMessage('Your email is already verified! Redirecting to dashboard...');
              setTimeout(() => {
                navigate(parsed.user.role === 'admin' || parsed.user.role === 'superadmin' ? '/admin' : '/dashboard');
              }, 1200);
              return;
            }
          } catch (e) {}
        }

        setStatus('error');
        setMessage(
          err.response?.data?.message || 'Verification link could not be verified. It may have expired.'
        );
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-header">
          <div className="auth-icon-circle">
            {status === 'verifying' && <Loader size={28} className="spin" />}
            {status === 'success' && <CheckCircle2 size={28} style={{ color: '#10b981' }} />}
            {status === 'already' && <MailCheck size={28} style={{ color: '#10b981' }} />}
            {status === 'error' && <AlertCircle size={28} style={{ color: '#ef4444' }} />}
          </div>

          {status === 'verifying' && (
            <>
              <h2>Verifying Your Email</h2>
              <p>Please wait while we activate your account…</p>
            </>
          )}

          {(status === 'success' || status === 'already') && (
            <>
              <h2 style={{ color: '#059669' }}>Email Verified! 🎉</h2>
              <p style={{ color: '#374151', fontSize: '0.95rem' }}>{message}</p>
              <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#6b7280' }}>
                Redirecting you to your dashboard…
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <h2 style={{ color: '#be123c' }}>Verification Failed</h2>
              <p style={{ color: '#4b5563', fontSize: '0.9rem' }}>{message}</p>
              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <Link to="/login" className="btn btn-primary">Sign In</Link>
                <Link to="/register" className="btn btn-secondary">Register Again</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
