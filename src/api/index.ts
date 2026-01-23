// Export API client
export { apiClient, API_BASE_URL } from './client';

// Export all API services
export * from './rules.api';
export * from './rule-functions.api';
export * from './rule-function-steps.api';
export * from './categories.api';
export * from './subfunctions.api';

// Re-export for convenience
import { rulesApi } from './rules.api';
import { ruleFunctionsApi } from './rule-functions.api';
import { ruleFunctionStepsApi } from './rule-function-steps.api';
import { categoriesApi } from './categories.api';
import { subfunctionsApi } from './subfunctions.api';

export const api = {
  rules: rulesApi,
  ruleFunctions: ruleFunctionsApi,
  ruleFunctionSteps: ruleFunctionStepsApi,
  categories: categoriesApi,
  subfunctions: subfunctionsApi,
};
