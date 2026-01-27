import { apiClient } from './client';

// Types matching backend API responses
export type RuleStatus = 'WIP' | 'TEST' | 'PENDING' | 'PROD';

export interface Rule {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  status: RuleStatus;
  version_major: number;
  version_minor: number;
  author: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateRuleDto {
  slug: string;
  name: string;
  description?: string;
  status?: RuleStatus;
  version_major?: number;
  version_minor?: number;
  author?: string;
}

export interface UpdateRuleDto {
  slug?: string;
  name?: string;
  description?: string;
  status?: RuleStatus;
  version_major?: number;
  version_minor?: number;
  author?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: RuleStatus;
  search?: string;
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

// Complete Rule Types
export interface SaveRuleStepDto {
  id: string;
  type: 'subFunction' | 'condition' | 'output';
  output_variable_name?: string;
  return_type?: string;
  next_step?: string | { true: string; false: string } | null;
  sequence: number;
  subfunction_id?: number;
  subfunction_params?: any[];
  conditions?: any[];
  output_data?: any;
}

export interface SaveRuleDto {
  code: string;
  return_type?: string;
  input_params?: any[];
  steps: SaveRuleStepDto[];
  created_by?: string;
  comment?: string;
}

export interface CompleteRuleResponse {
  rule: Rule;
  rule_function: {
    id: number;
    code: string;
    return_type: string | null;
    input_params: any[];
  };
  steps: any[];
}

// Rules API Service
export const rulesApi = {
  /**
   * Get all rules with pagination and optional status filter
   */
  async getAll(params?: PaginationParams): Promise<PaginatedResponse<Rule>> {
    const response = await apiClient.get<PaginatedResponse<Rule>>('/api/rules', { params });
    return response.data;
  },

  /**
   * Get a single rule by ID
   */
  async getById(id: number): Promise<Rule> {
    const response = await apiClient.get<ApiResponse<Rule>>(`/api/rules/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch rule');
    }
    return response.data.data;
  },

  /**
   * Create a new rule
   */
  async create(data: CreateRuleDto): Promise<Rule> {
    const response = await apiClient.post<ApiResponse<Rule>>('/api/rules', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create rule');
    }
    return response.data.data;
  },

  /**
   * Update an existing rule
   */
  async update(id: number, data: UpdateRuleDto): Promise<Rule> {
    const response = await apiClient.put<ApiResponse<Rule>>(`/api/rules/${id}`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update rule');
    }
    return response.data.data;
  },

  /**
   * Delete a rule (soft delete)
   */
  async delete(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/rules/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete rule');
    }
  },

  /**
   * Save complete rule - creates/updates rule_functions and rule_function_steps
   * Creates rule_versions entry on first save
   */
  async saveComplete(id: number, data: SaveRuleDto): Promise<CompleteRuleResponse> {
    const response = await apiClient.post<ApiResponse<CompleteRuleResponse>>(`/api/rules/${id}/save`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to save complete rule');
    }
    return response.data.data;
  },

  /**
   * Update complete rule - updates rule_functions and rule_function_steps
   */
  async updateComplete(id: number, data: SaveRuleDto): Promise<CompleteRuleResponse> {
    const response = await apiClient.put<ApiResponse<CompleteRuleResponse>>(`/api/rules/${id}/complete`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update complete rule');
    }
    return response.data.data;
  },

  /**
   * Get complete rule - fetches rule with all details, input_params, code and steps
   */
  async getComplete(id: number): Promise<CompleteRuleResponse> {
    const response = await apiClient.get<ApiResponse<CompleteRuleResponse>>(`/api/rules/${id}/complete`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch complete rule');
    }
    return response.data.data;
  },
};
