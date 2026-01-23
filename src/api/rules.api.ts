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
};
