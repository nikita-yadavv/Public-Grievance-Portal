import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, LogOut, User, Edit3, Check, Mail, AlertTriangle } from 'lucide-react';
import EditProfileModal from './EditProfileModal';
import API from '../services/api';

/**
 * Navbar Component
 * Synchronizes user state on route change and opens profile modal.
 */
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Sync user state from localStorage and verify with /auth/me
  const syncUser = async () => {
    const stored = localStorage.getItem('grievance_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.user) {
          setUser(parsed.user);
        }

        // Fetch fresh status from backend if token exists
        if (parsed?.token) {
          const res = await API.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            parsed.user = res.data.user;
            localStorage.setItem('grievance_user', JSON.stringify(parsed));
          }
        }
      } catch (e) {
        // Fallback to stored user or null
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    syncUser();
  }, [location.pathname]);

  const handleSignOut = () => {
    localStorage.removeItem('grievance_user');
    setUser(null);
    navigate('/login');
  };

  const handleProfileUpdated = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <ShieldAlert className="brand-icon" size={28} />
            <div>
              <span className="brand-title">Public Grievance Portal</span>
              <span className="brand-subtitle">Citizen Redressal & Resolution System</span>
            </div>
          </Link>

          <div className="nav-actions">
            {user ? (
              <div className="user-profile-menu">
                {/* Email Verification Status Pill */}
                {user.isEmailVerified ? (
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                      padding: '3px 9px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Your email address is verified"
                  >
                    <Check size={12} /> Email Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditProfileOpen(true)}
                    style={{
                      background: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                      padding: '3px 9px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                    title="Your email is unverified — Click to verify"
                  >
                    <Mail size={12} /> Verify Email
                  </button>
                )}

                {/* User Identity Display */}
                <div className="user-badge" style={{ cursor: 'default' }}>
                  <User size={16} />
                  <span className="user-name">{user.name}</span>
                  <span className={`role-pill role-${user.role}`}>
                    {user.role?.toUpperCase()}
                  </span>
                </div>

                {/* My Profile Button */}
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="btn btn-sm btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600 }}
                  title="View My Profile"
                >
                  <User size={14} />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="btn-logout"
                  title="Sign Out"
                >
                  <LogOut size={17} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="nav-auth-buttons">
                <Link to="/login" className="btn btn-secondary">Sign In</Link>
                <Link to="/register" className="btn btn-primary">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Edit Profile Dialog */}
      {user && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentUser={user}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </>
  );
};

export default Navbar;
