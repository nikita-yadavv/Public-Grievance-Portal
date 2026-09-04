import React, { useState } from 'react';
import { Mail, Check, AlertCircle, ExternalLink, Loader } from 'lucide-react';
import API from '../services/api';

/**
 * EmailVerificationBanner
 * Displays a non-intrusive yet prominent reminder on dashboards
 * if the user's email address is currently unverified.
 * Offers 1-click verification email sending and immediate activation link.
 */
const EmailVerificationBanner = ({ currentUser, onUserUpdated }) => {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');

  if (!currentUser || currentUser.isEmailVerified) {
    return null;
  }

  const handleSendVerification = async () => {
    setSending(true);
    setMessage('');
    setVerificationUrl('');

    try {
      const res = await API.post('/auth/send-verification-email');
      if (res.data.success) {
        setMessage(res.data.message || 'Verification link generated successfully.');
        if (res.data.verificationUrl) {
          setVerificationUrl(res.data.verificationUrl);
        }
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to dispatch verification email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        border: '1px solid #fde68a',
        borderRadius: '12px',
        padding: '14px 18px',
        marginBottom: '20px',
        boxShadow: '0 2px 6px rgba(217, 119, 6, 0.08)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              flexShrink: 0
            }}
          >
            <Mail size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <strong style={{ color: '#92400e', fontSize: '0.92rem' }}>
                Email Verification Pending
              </strong>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: '#fde68a',
                  color: '#b45309',
                  padding: '1px 8px',
                  borderRadius: '999px'
                }}
              >
                UNVERIFIED
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#78350f', lineHeight: 1.4 }}>
              Verify your email (<strong>{currentUser.email}</strong>) to receive automatic updates whenever municipal officers resolve your complaints.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleSendVerification}
            disabled={sending}
            className="btn btn-sm btn-primary"
            style={{
              fontSize: '0.82rem',
              padding: '7px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700
            }}
          >
            {sending ? <Loader size={14} className="spin" /> : <Mail size={14} />}
            <span>{sending ? 'Sending Link...' : '✉️ Send Verification Link'}</span>
          </button>
        </div>
      </div>

      {/* Result feedback and instant verification link */}
      {message && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: '#ffffff',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} style={{ color: '#059669' }} />
            <span style={{ fontSize: '0.84rem', color: '#166534', fontWeight: 600 }}>{message}</span>
          </div>

          {verificationUrl && (
            <a
              href={verificationUrl}
              className="btn btn-sm"
              style={{
                fontSize: '0.8rem',
                padding: '4px 12px',
                background: '#059669',
                color: '#ffffff',
                fontWeight: 700,
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>⚡ Click Here to Verify Email Now</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailVerificationBanner;
