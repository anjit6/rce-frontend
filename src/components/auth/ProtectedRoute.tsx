import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spin } from 'antd';
import { PermissionId } from '../../constants/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: readonly PermissionId[] | PermissionId[];
  requireAll?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredPermissions = [],
  requireAll = false
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasAnyPermission, hasAllPermissions } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permissions if required
  if (requiredPermissions.length > 0) {
    // Convert readonly array to mutable for the permission check functions
    const permissions = [...requiredPermissions];
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center flex-col">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      );
    }
  }

  return <>{children}</>;
}
