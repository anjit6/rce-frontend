import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, PaginationParams } from './rules.api';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateCategoryDto {
  id: string;
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
}

// Categories API Service
export const categoriesApi = {
  /**
   * Get all categories with pagination
   */
  async getAll(params?: PaginationParams): Promise<PaginatedResponse<Category>> {
    const response = await apiClient.get<PaginatedResponse<Category>>('/api/categories', { params });
    return response.data;
  },

  /**
   * Get a single category by ID
   */
  async getById(id: string): Promise<Category> {
    const response = await apiClient.get<ApiResponse<Category>>(`/api/categories/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch category');
    }
    return response.data.data;
  },

  /**
   * Create a new category
   */
  async create(data: CreateCategoryDto): Promise<Category> {
    const response = await apiClient.post<ApiResponse<Category>>('/api/categories', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create category');
    }
    return response.data.data;
  },

  /**
   * Update an existing category
   */
  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    const response = await apiClient.put<ApiResponse<Category>>(`/api/categories/${id}`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update category');
    }
    return response.data.data;
  },

  /**
   * Delete a category (soft delete)
   */
  async delete(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/categories/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete category');
    }
  },
};
