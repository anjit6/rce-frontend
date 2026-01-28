import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PermissionId } from '../../constants/permissions';

interface PermissionGateProps {
  children: ReactNode;
  /**
   * Required permission IDs. User must have at least one of these permissions.
   * Use requireAll=true to require all permissions.
   */
  permissions: PermissionId[];
  /** If true, user must have ALL specified permissions. Default: false (any permission) */
  requireAll?: boolean;
  /** Content to render if user doesn't have permission. Default: null (renders nothing) */
  fallback?: ReactNode;
}

/**
 * PermissionGate component - conditionally renders children based on user permissions
 *
 * @example
 * // Requires any of the specified permissions
 * <PermissionGate permissions={[PERMISSIONS.CREATE_RULE, PERMISSIONS.EDIT_RULE]}>
 *   <CreateButton />
 * </PermissionGate>
 *
 * @example
 * // Requires ALL specified permissions
 * <PermissionGate permissions={[PERMISSIONS.VIEW_RULE, PERMISSIONS.EDIT_RULE]} requireAll>
 *   <EditButton />
 * </PermissionGate>
 *
 * @example
 * // With fallback content
 * <PermissionGate
 *   permissions={[PERMISSIONS.CREATE_RULE]}
 *   fallback={<span>You don't have permission</span>}
 * >
 *   <CreateButton />
 * </PermissionGate>
 */
export default function PermissionGate({
  children,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  // If no permissions specified, render children
  if (permissions.length === 0) {
    return <>{children}</>;
  }

  // Check single permission
  if (permissions.length === 1) {
    return hasPermission(permissions[0]) ? <>{children}</> : <>{fallback}</>;
  }

  // Check multiple permissions
  const hasAccess = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook to check permissions programmatically
 *
 * @example
 * const canCreateRule = usePermission(PERMISSIONS.CREATE_RULE);
 * const canManageRules = usePermissions([PERMISSIONS.CREATE_RULE, PERMISSIONS.EDIT_RULE]);
 * const canDoAll = usePermissions([PERMISSIONS.CREATE_RULE, PERMISSIONS.EDIT_RULE], true);
 */
export function usePermission(permissionId: PermissionId): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permissionId);
}

export function usePermissions(permissionIds: PermissionId[], requireAll = false): boolean {
  const { hasAnyPermission, hasAllPermissions } = useAuth();

  if (permissionIds.length === 0) return true;

  return requireAll
    ? hasAllPermissions(permissionIds)
    : hasAnyPermission(permissionIds);
}
