import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spin, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
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
        <div className="min-h-screen flex items-center justify-center flex-col bg-gray-50">
          <div className="text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={() => window.location.href = '/rules'}
              className="rounded-lg bg-red-600 hover:bg-red-500 border-none"
            >
              Go to Rules
            </Button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
