import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, LogOut, User, Edit3 } from 'lucide-react';
import EditProfileModal from './EditProfileModal';

/**
 * Navbar Component
 * Synchronizes user state on route change and opens profile modal.
 */
const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Sync user state whenever route changes or after profile update
  useEffect(() => {
    const stored = localStorage.getItem('grievance_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed?.user || null);
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
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
                <button
                  type="button"
                  className="user-badge clickable"
                  onClick={() => setIsEditProfileOpen(true)}
                  title="Click to edit profile"
                >
                  <User size={16} />
                  <span className="user-name">{user.name}</span>
                  <span className={`role-pill role-${user.role}`}>
                    {user.role?.toUpperCase()}
                  </span>
                  <Edit3 size={13} className="badge-edit-icon" />
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
