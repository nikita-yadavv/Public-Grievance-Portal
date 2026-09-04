import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { MailCheck, AlertCircle, Loader, CheckCircle2 } from 'lucide-react';
import API from '../services/api';

/**
 * VerifyEmail Page
 * Concepts Covered:
 * - Unit 4: useEffect, useSearchParams (React Router)
 * - Unit 5: Token-based email verification flow
 *
 * This page is visited when a user clicks the verification link in their email.
 * The ?token=... query param is sent to the backend to activate the account.
 * On success, the user is automatically signed in and redirected.
 */
const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error' | 'already'
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token found. Please use the link from your email.');
        return;
      }

      try {
        const res = await API.get(`/auth/verify-email?token=${token}`);
        if (res.data.success) {
          if (res.data.alreadyVerified) {
            setStatus('already');
            setMessage(res.data.message);
            return;
          }

          // Auto sign-in: save token and user in localStorage
          localStorage.setItem(
            'grievance_user',
            JSON.stringify({
              token: res.data.token,
              user: res.data.user
            })
          );

          setStatus('success');
          setMessage(res.data.message);

          // Redirect to the appropriate dashboard after 2 seconds
          setTimeout(() => {
            const role = res.data.user?.role;
            if (role === 'admin' || role === 'superadmin') {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
          }, 2000);
        }
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.message || 'Verification failed. The link may be invalid or expired.'
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
            {status === 'verifying' && <Loader size={26} className="spin" />}
            {status === 'success' && <CheckCircle2 size={26} />}
            {status === 'already' && <MailCheck size={26} />}
            {status === 'error' && <AlertCircle size={26} />}
          </div>

          {status === 'verifying' && (
            <>
              <h2>Verifying Your Email</h2>
              <p>Please wait while we confirm your email address…</p>
            </>
          )}

          {status === 'success' && (
            <>
              <h2 style={{ color: '#059669' }}>Email Verified! 🎉</h2>
              <p>{message}</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#9ca3af' }}>
                Redirecting you to your dashboard…
              </p>
            </>
          )}

          {status === 'already' && (
            <>
              <h2>Already Verified</h2>
              <p>{message}</p>
              <Link to="/login" className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
                Sign In
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <h2 style={{ color: '#be123c' }}>Verification Failed</h2>
              <p style={{ color: '#4b5563' }}>{message}</p>
              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <Link to="/register" className="btn btn-secondary">Register Again</Link>
                <Link to="/login" className="btn btn-primary">Sign In</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
