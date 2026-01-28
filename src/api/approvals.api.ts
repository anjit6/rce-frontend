import { apiClient } from './client';

// Types matching backend API
export type RuleStatus = 'WIP' | 'TEST' | 'PENDING' | 'PROD';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export interface RuleFunctionInputParam {
  sequence: number;
  name: string;
  fieldName?: string;
  data_type: string;
  param_type?: string;
  mandatory: boolean;
  default_value: string | null;
  description?: string;
}

export interface RuleApproval {
  id: string;
  rule_version_id: string | null;
  rule_id: number;
  rule_name?: string;
  rule_slug?: string;
  rule_description?: string;
  from_stage: RuleStatus;
  to_stage: RuleStatus;
  moved_to_stage: RuleStatus | null;
  requested_by: string;
  requested_by_name?: string; // User's full name from users table
  requested_at: string;
  request_comment: string | null;
  status: ApprovalStatus;
  action: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | null;
  action_by: string | null;
  action_by_name?: string; // User's full name from users table
  action_at: string | null;
  action_comment: string | null;
  version_major?: number;
  version_minor?: number;
  created_at: string;
  updated_at: string;
  // Fields for test rule functionality
  rule_function_code?: string;
  rule_function_input_params?: RuleFunctionInputParam[];
  rule_steps?: any[];
}

export interface CreateApprovalDto {
  rule_version_id: string;
  rule_id: number;
  from_stage: RuleStatus;
  to_stage: RuleStatus;
  requested_by: string;
  request_comment?: string;
}

export interface ApproveRejectDto {
  action: 'APPROVED' | 'REJECTED';
  action_by: string;
  action_comment?: string;
}

export interface ApprovalFilterParams {
  page?: number;
  limit?: number;
  status?: ApprovalStatus | 'ALL';
  rule_id?: number;
  requested_by?: string;
  search?: string;
  from_stage?: RuleStatus;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Approvals API Service
export const approvalsApi = {
  /**
   * Get all approvals with pagination and filters
   */
  async getAll(params?: ApprovalFilterParams): Promise<PaginatedResponse<RuleApproval>> {
    const response = await apiClient.get<PaginatedResponse<RuleApproval>>('/api/approvals', { params });
    return response.data;
  },

  /**
   * Get a single approval by ID
   */
  async getById(id: string): Promise<RuleApproval> {
    const response = await apiClient.get<ApiResponse<RuleApproval>>(`/api/approvals/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch approval');
    }
    return response.data.data;
  },

  /**
   * Create a new approval request
   */
  async create(data: CreateApprovalDto): Promise<RuleApproval> {
    const response = await apiClient.post<ApiResponse<RuleApproval>>('/api/approvals', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create approval request');
    }
    return response.data.data;
  },

  /**
   * Approve or reject an approval request
   */
  async approveOrReject(id: string, data: ApproveRejectDto): Promise<RuleApproval> {
    const response = await apiClient.put<ApiResponse<RuleApproval>>(`/api/approvals/${id}/action`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to process approval request');
    }
    return response.data.data;
  },

  /**
   * Withdraw an approval request
   */
  async withdraw(id: string, withdrawn_by: string): Promise<RuleApproval> {
    const response = await apiClient.put<ApiResponse<RuleApproval>>(`/api/approvals/${id}/withdraw`, {
      withdrawn_by,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to withdraw approval request');
    }
    return response.data.data;
  },
};
