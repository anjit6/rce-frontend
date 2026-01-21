import { subfunctionsApi, Subfunction as ApiSubfunction } from '../api';

// Frontend subfunction type for compatibility with existing components
export interface SubfunctionInputParam {
  name: string;
  label?: string;
  dataType: string;
  mandatory: boolean;
  sequence: number;
  default?: any;
}

export interface Subfunction {
  id: number;
  name: string;
  description: string;
  version: string;
  functionName: string;
  categoryId: string;
  code: string;
  inputParams: SubfunctionInputParam[];
  returnType: string;
}

// Convert backend API subfunction to frontend format
const convertApiSubfunctionToFrontend = (apiSubfunction: ApiSubfunction): Subfunction => {
  return {
    id: apiSubfunction.id,
    name: apiSubfunction.name,
    description: apiSubfunction.description || '',
    version: apiSubfunction.version,
    functionName: apiSubfunction.function_name,
    categoryId: apiSubfunction.category_id || '',
    code: apiSubfunction.code,
    returnType: apiSubfunction.return_type || '',
    inputParams: apiSubfunction.input_params.map(param => ({
      name: param.name,
      label: param.name,
      dataType: param.data_type,
      mandatory: param.mandatory,
      sequence: param.sequence,
      default: param.default_value,
    })),
  };
};

// Subfunctions Service
export const subfunctionsService = {
  /**
   * Get all subfunctions
   */
  async getSubfunctions(categoryId?: string, page: number = 1, limit: number = 1000): Promise<Subfunction[]> {
    try {
      const response = await subfunctionsApi.getAll({
        page,
        limit,
        category_id: categoryId
      });
      return response.data.map(apiSubfunction => convertApiSubfunctionToFrontend(apiSubfunction));
    } catch (error) {
      console.error('Failed to fetch subfunctions:', error);
      throw error;
    }
  },

  /**
   * Get subfunction by ID
   */
  async getSubfunctionById(id: number): Promise<Subfunction | undefined> {
    try {
      const apiSubfunction = await subfunctionsApi.getById(id);
      return convertApiSubfunctionToFrontend(apiSubfunction);
    } catch (error) {
      console.error(`Failed to fetch subfunction ${id}:`, error);
      return undefined;
    }
  },

  /**
   * Get subfunctions by category
   */
  async getSubfunctionsByCategory(categoryId: string): Promise<Subfunction[]> {
    return this.getSubfunctions(categoryId);
  },
};

// Export legacy functions for backward compatibility
export const getSubfunctions = subfunctionsService.getSubfunctions;
export const getSubfunctionById = subfunctionsService.getSubfunctionById;
export const getSubfunctionsByCategory = subfunctionsService.getSubfunctionsByCategory;
