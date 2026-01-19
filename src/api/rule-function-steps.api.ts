import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, PaginationParams } from './rules.api';

// Types for rule function steps
export type StepType = 'subFunction' | 'condition' | 'output';
export type DataSourceType = 'static' | 'inputParam' | 'stepOutputVariable';

export interface SubfunctionParamMapping {
  subfunction_param_name: string;
  data_type: DataSourceType;
  data_value: string;
}

export interface StepCondition {
  sequence: number;
  and_or: 'AND' | 'OR' | null;
  lhs_type: DataSourceType;
  lhs_data_type: string;
  lhs_value: string;
  operator: '==' | '<=' | '<' | '>=' | '>' | '!=' | 'contains' | 'does not contain' | 'starts with' | 'ends with';
  rhs_type: DataSourceType;
  rhs_data_type: string;
  rhs_value: string;
}

export interface StepOutputData {
  data_type: DataSourceType;
  data_value_type: string;
  data_value: string;
}

export type NextStep = string | { true: string; false: string } | null;

export interface RuleFunctionStep {
  id: string;
  rule_function_id: number;
  type: StepType;
  output_variable_name: string | null;
  return_type: string | null;
  next_step: NextStep;
  sequence: number;
  subfunction_id: number | null;
  subfunction_params: SubfunctionParamMapping[];
  conditions: StepCondition[];
  output_data: StepOutputData | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateRuleFunctionStepDto {
  id: string;
  rule_function_id: number;
  type: StepType;
  output_variable_name?: string;
  return_type?: string;
  next_step?: NextStep;
  sequence: number;
  subfunction_id?: number;
  subfunction_params?: SubfunctionParamMapping[];
  conditions?: StepCondition[];
  output_data?: StepOutputData;
}

export interface UpdateRuleFunctionStepDto {
  type?: StepType;
  output_variable_name?: string;
  return_type?: string;
  next_step?: NextStep;
  sequence?: number;
  subfunction_id?: number;
  subfunction_params?: SubfunctionParamMapping[];
  conditions?: StepCondition[];
  output_data?: StepOutputData;
}

export interface GetStepsByRuleFunctionParams extends PaginationParams {
  rule_function_id: number;
}

// Rule Function Steps API Service
export const ruleFunctionStepsApi = {
  /**
   * Get all rule function steps with pagination
   */
  async getAll(params?: PaginationParams): Promise<PaginatedResponse<RuleFunctionStep>> {
    const response = await apiClient.get<PaginatedResponse<RuleFunctionStep>>('/api/rule-function-steps', { params });
    return response.data;
  },

  /**
   * Get steps by rule function ID
   */
  async getByRuleFunctionId(ruleFunctionId: number, params?: PaginationParams): Promise<PaginatedResponse<RuleFunctionStep>> {
    const response = await apiClient.get<PaginatedResponse<RuleFunctionStep>>('/api/rule-function-steps', {
      params: { ...params, rule_function_id: ruleFunctionId }
    });
    return response.data;
  },

  /**
   * Get a single step by ID and rule function ID
   */
  async getById(id: string, ruleFunctionId: number): Promise<RuleFunctionStep> {
    const response = await apiClient.get<ApiResponse<RuleFunctionStep>>(`/api/rule-function-steps/${id}/${ruleFunctionId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to fetch rule function step');
    }
    return response.data.data;
  },

  /**
   * Create a new rule function step
   */
  async create(data: CreateRuleFunctionStepDto): Promise<RuleFunctionStep> {
    const response = await apiClient.post<ApiResponse<RuleFunctionStep>>('/api/rule-function-steps', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to create rule function step');
    }
    return response.data.data;
  },

  /**
   * Update an existing rule function step
   */
  async update(id: string, ruleFunctionId: number, data: UpdateRuleFunctionStepDto): Promise<RuleFunctionStep> {
    const response = await apiClient.put<ApiResponse<RuleFunctionStep>>(`/api/rule-function-steps/${id}/${ruleFunctionId}`, data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update rule function step');
    }
    return response.data.data;
  },

  /**
   * Delete a rule function step (soft delete)
   */
  async delete(id: string, ruleFunctionId: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(`/api/rule-function-steps/${id}/${ruleFunctionId}`);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to delete rule function step');
    }
  },

  /**
   * Bulk create multiple steps
   */
  async bulkCreate(steps: CreateRuleFunctionStepDto[]): Promise<RuleFunctionStep[]> {
    const promises = steps.map(step => this.create(step));
    return Promise.all(promises);
  },

  /**
   * Bulk update multiple steps
   */
  async bulkUpdate(updates: Array<{ id: string; rule_function_id: number; data: UpdateRuleFunctionStepDto }>): Promise<RuleFunctionStep[]> {
    const promises = updates.map(({ id, rule_function_id, data }) =>
      this.update(id, rule_function_id, data)
    );
    return Promise.all(promises);
  },
};
