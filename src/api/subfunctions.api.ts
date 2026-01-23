import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, PaginationParams } from './rules.api';

export interface SubfunctionInputParam {
  sequence: number;
  name: string;
  data_type: string;
  mandatory: boolean;
  default_value: string | null;
  description?: string;
}

export interface Subfunction {
  id: number;
  name: string;
  description: string | null;
  version: string;
  function_name: string;
  category_id: string | null;
  code: string;
  return_type: string | null;
  input_params: SubfunctionInputParam[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateSubfunctionDto {
  name: string;
  description?: string;
  version?: string;
  function_name: string;
  category_id?: string;
  code: string;
  return_type?: string;
  input_params?: SubfunctionInputParam[];
}

export interface UpdateSubfunctionDto {
  name?: string;
  description?: string;
  version?: string;
  function_name?: string;
  category_id?: string | null;
  code?: string;
  return_type?: string;
  input_params?: SubfunctionInputParam[];
}

export interface GetSubfunctionsParams extends PaginationParams {
  category_id?: string;
}

// Subfunctions API Service
export const subfunctionsApi = {
  /**
   * Get all subfunctions with pagination and optional category filter
   */
  async getAll(params?: GetSubfunctionsParams): Promise<PaginatedResponse<Subfunction>> {
    const response = await apiClient.get<PaginatedResponse<Subfunction>>('/api/subfunctions', { params });
    return response.data;
  },

  /**
   * Get a single subfunction by ID
   */
  async getById(id: number): Promise<Subfunction> {
    const response = await apiClient.get<ApiResponse<Subfunction>>(`/api/subfunctions/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch subfunction');
    }
    return response.data.data;
  },

  /**
   * Get subfunctions by category
   */
  async getByCategory(categoryId: string, params?: PaginationParams): Promise<PaginatedResponse<Subfunction>> {
    return this.getAll({ ...params, category_id: categoryId });
  },

  /**
   * Create a new subfunction
   */
  async create(data: CreateSubfunctionDto): Promise<Subfunction> {
    const response = await apiClient.post<ApiResponse<Subfunction>>('/api/subfunctions', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create subfunction');
    }
    return response.data.data;
  },

  /**
   * Update an existing subfunction
   */
  async update(id: number, data: UpdateSubfunctionDto): Promise<Subfunction> {
    const response = await apiClient.put<ApiResponse<Subfunction>>(`/api/subfunctions/${id}`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update subfunction');
    }
    return response.data.data;
  },

  /**
   * Delete a subfunction (soft delete)
   */
  async delete(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/subfunctions/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete subfunction');
    }
  },
};
