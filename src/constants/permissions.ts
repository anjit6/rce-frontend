// Permission constants matching the database seed.sql
// These are used for RBAC checks throughout the application

export const PERMISSIONS = {
  // Rule Management Permissions (IDs 1-7)
  CREATE_RULE: 1,
  EDIT_RULE: 2,
  VIEW_RULE: 3,
  TEST_RULE: 4,
  VIEW_OWN_RULES: 5,
  VIEW_ALL_RULES: 6,
  SAVE_VERSION: 7,

  // Rule Promotion Permissions (IDs 10-12)
  PROMOTE_WIP_TO_TEST: 10,
  PROMOTE_TEST_TO_PENDING: 11,
  PROMOTE_PENDING_TO_PROD: 12,

  // Approval Request Permissions (IDs 20-24)
  VIEW_PENDING_APPROVALS: 20,
  VIEW_OWN_REQUESTS: 21,
  VIEW_ALL_REQUESTS: 22,
  CREATE_APPROVAL_REQUEST: 23,
  VIEW_APPROVAL_REQUEST_DETAILS: 24,

  // Approval Action Permissions (IDs 30-33)
  APPROVE_WIP_TO_TEST: 30,
  APPROVE_TEST_TO_PENDING: 31,
  APPROVE_PENDING_TO_PROD: 32,
  REJECT_APPROVAL: 33,
} as const;

export type PermissionId = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Permission names for display purposes
export const PERMISSION_NAMES: Record<PermissionId, string> = {
  [PERMISSIONS.CREATE_RULE]: 'CREATE_RULE',
  [PERMISSIONS.EDIT_RULE]: 'EDIT_RULE',
  [PERMISSIONS.VIEW_RULE]: 'VIEW_RULE',
  [PERMISSIONS.TEST_RULE]: 'TEST_RULE',
  [PERMISSIONS.VIEW_OWN_RULES]: 'VIEW_OWN_RULES',
  [PERMISSIONS.VIEW_ALL_RULES]: 'VIEW_ALL_RULES',
  [PERMISSIONS.SAVE_VERSION]: 'SAVE_VERSION',
  [PERMISSIONS.PROMOTE_WIP_TO_TEST]: 'PROMOTE_WIP_TO_TEST',
  [PERMISSIONS.PROMOTE_TEST_TO_PENDING]: 'PROMOTE_TEST_TO_PENDING',
  [PERMISSIONS.PROMOTE_PENDING_TO_PROD]: 'PROMOTE_PENDING_TO_PROD',
  [PERMISSIONS.VIEW_PENDING_APPROVALS]: 'VIEW_PENDING_APPROVALS',
  [PERMISSIONS.VIEW_OWN_REQUESTS]: 'VIEW_OWN_REQUESTS',
  [PERMISSIONS.VIEW_ALL_REQUESTS]: 'VIEW_ALL_REQUESTS',
  [PERMISSIONS.CREATE_APPROVAL_REQUEST]: 'CREATE_APPROVAL_REQUEST',
  [PERMISSIONS.VIEW_APPROVAL_REQUEST_DETAILS]: 'VIEW_APPROVAL_REQUEST_DETAILS',
  [PERMISSIONS.APPROVE_WIP_TO_TEST]: 'APPROVE_WIP_TO_TEST',
  [PERMISSIONS.APPROVE_TEST_TO_PENDING]: 'APPROVE_TEST_TO_PENDING',
  [PERMISSIONS.APPROVE_PENDING_TO_PROD]: 'APPROVE_PENDING_TO_PROD',
  [PERMISSIONS.REJECT_APPROVAL]: 'REJECT_APPROVAL',
};

// Role IDs matching database
export const ROLES = {
  DEVELOPER: 1,
  QA: 2,
  APPROVER: 3,
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

// Role names for display
export const ROLE_NAMES: Record<RoleId, string> = {
  [ROLES.DEVELOPER]: 'DEVELOPER',
  [ROLES.QA]: 'QA',
  [ROLES.APPROVER]: 'APPROVER',
};

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  // Permissions for viewing rules
  VIEW_RULES: [
    PERMISSIONS.VIEW_RULE,
    PERMISSIONS.VIEW_OWN_RULES,
    PERMISSIONS.VIEW_ALL_RULES,
  ],

  // Permissions for managing rules (create/edit/save version)
  MANAGE_RULES: [
    PERMISSIONS.CREATE_RULE,
    PERMISSIONS.EDIT_RULE,
    PERMISSIONS.SAVE_VERSION,
  ],

  // Permissions for testing rules
  TEST_RULES: [
    PERMISSIONS.TEST_RULE,
  ],

  // Permissions for promoting rules
  PROMOTE_RULES: [
    PERMISSIONS.PROMOTE_WIP_TO_TEST,
    PERMISSIONS.PROMOTE_TEST_TO_PENDING,
    PERMISSIONS.PROMOTE_PENDING_TO_PROD,
  ],

  // Permissions for viewing approvals
  VIEW_APPROVALS: [
    PERMISSIONS.VIEW_PENDING_APPROVALS,
    PERMISSIONS.VIEW_OWN_REQUESTS,
    PERMISSIONS.VIEW_ALL_REQUESTS,
    PERMISSIONS.VIEW_APPROVAL_REQUEST_DETAILS,
  ],

  // Permissions for managing approval requests
  MANAGE_APPROVALS: [
    PERMISSIONS.CREATE_APPROVAL_REQUEST,
  ],

  // Permissions for approving/rejecting
  APPROVE_REJECT: [
    PERMISSIONS.APPROVE_WIP_TO_TEST,
    PERMISSIONS.APPROVE_TEST_TO_PENDING,
    PERMISSIONS.APPROVE_PENDING_TO_PROD,
    PERMISSIONS.REJECT_APPROVAL,
  ],
} as const;

// Stage transition permission mapping
export const STAGE_TRANSITION_PERMISSIONS = {
  'WIP_TO_TEST': {
    promote: PERMISSIONS.PROMOTE_WIP_TO_TEST,
    approve: PERMISSIONS.APPROVE_WIP_TO_TEST,
  },
  'TEST_TO_PENDING': {
    promote: PERMISSIONS.PROMOTE_TEST_TO_PENDING,
    approve: PERMISSIONS.APPROVE_TEST_TO_PENDING,
  },
  'PENDING_TO_PROD': {
    promote: PERMISSIONS.PROMOTE_PENDING_TO_PROD,
    approve: PERMISSIONS.APPROVE_PENDING_TO_PROD,
  },
} as const;

// Helper function to get required permission for stage transition
export function getPromotePermission(fromStage: string, toStage: string): PermissionId | null {
  const key = `${fromStage}_TO_${toStage}` as keyof typeof STAGE_TRANSITION_PERMISSIONS;
  return STAGE_TRANSITION_PERMISSIONS[key]?.promote || null;
}

export function getApprovePermission(fromStage: string, toStage: string): PermissionId | null {
  const key = `${fromStage}_TO_${toStage}` as keyof typeof STAGE_TRANSITION_PERMISSIONS;
  return STAGE_TRANSITION_PERMISSIONS[key]?.approve || null;
}
