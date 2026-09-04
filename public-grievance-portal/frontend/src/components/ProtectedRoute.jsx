import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles, allowedRole }) => {
  const storedUser = localStorage.getItem('grievance_user');

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  const { user } = JSON.parse(storedUser);

  // Normalize the allowed roles prop into an array
  let roles = [];
  if (allowedRoles && Array.isArray(allowedRoles)) {
    roles = allowedRoles;
  } else if (allowedRoles) {
    roles = [allowedRoles];
  } else if (allowedRole) {
    roles = [allowedRole];
  }

  if (roles.length > 0) {
    const isAllowed = roles.includes(user.role) || (roles.includes('admin') && user.role === 'superadmin');
    if (!isAllowed) {
      const targetHome = (user.role === 'admin' || user.role === 'superadmin') ? '/admin' : '/dashboard';
      return <Navigate to={targetHome} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
