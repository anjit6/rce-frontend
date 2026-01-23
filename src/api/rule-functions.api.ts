import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, PaginationParams } from './rules.api';

// Types for rule functions
export type ParamType = 'inputField' | 'metaDataField' | 'default';

export interface RuleFunctionInputParam {
  sequence: number;
  name: string;
  data_type: string;
  param_type: ParamType;
  mandatory: boolean;
  default_value: string | null;
  description?: string;
}

export interface RuleFunction {
  id: number;
  rule_id: number;
  code: string;
  return_type: string | null;
  input_params: RuleFunctionInputParam[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateRuleFunctionDto {
  rule_id: number;
  code: string;
  return_type?: string;
  input_params?: RuleFunctionInputParam[];
}

export interface UpdateRuleFunctionDto {
  code?: string;
  return_type?: string;
  input_params?: RuleFunctionInputParam[];
}

// Rule Functions API Service
export const ruleFunctionsApi = {
  /**
   * Get all rule functions with pagination
   */
  async getAll(params?: PaginationParams): Promise<PaginatedResponse<RuleFunction>> {
    const response = await apiClient.get<PaginatedResponse<RuleFunction>>('/api/rule-functions', { params });
    return response.data;
  },

  /**
   * Get a single rule function by ID
   */
  async getById(id: number): Promise<RuleFunction> {
    const response = await apiClient.get<ApiResponse<RuleFunction>>(`/api/rule-functions/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch rule function');
    }
    return response.data.data;
  },

  /**
   * Get rule function by rule ID
   */
  async getByRuleId(ruleId: number): Promise<RuleFunction> {
    const response = await apiClient.get<ApiResponse<RuleFunction>>(`/api/rule-functions/rule/${ruleId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch rule function');
    }
    return response.data.data;
  },

  /**
   * Create a new rule function
   */
  async create(data: CreateRuleFunctionDto): Promise<RuleFunction> {
    const response = await apiClient.post<ApiResponse<RuleFunction>>('/api/rule-functions', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create rule function');
    }
    return response.data.data;
  },

  /**
   * Update an existing rule function
   */
  async update(id: number, data: UpdateRuleFunctionDto): Promise<RuleFunction> {
    const response = await apiClient.put<ApiResponse<RuleFunction>>(`/api/rule-functions/${id}`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update rule function');
    }
    return response.data.data;
  },

  /**
   * Delete a rule function (soft delete)
   */
  async delete(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/rule-functions/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete rule function');
    }
  },
};
