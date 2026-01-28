// Export API client
export { apiClient, API_BASE_URL } from './client';

// Export specific API services
export { authApi } from './auth.api';
export { rulesApi } from './rules.api';
export { ruleFunctionsApi } from './rule-functions.api';
export { ruleFunctionStepsApi } from './rule-function-steps.api';
export { categoriesApi } from './categories.api';
export { subfunctionsApi } from './subfunctions.api';

// Export types
export type { Rule, RuleStatus, CreateRuleDto, UpdateRuleDto, ApprovalRequestRule, SaveVersionDto, RuleVersion, SaveVersionResponse } from './rules.api';
export type { Subfunction } from './subfunctions.api';

// Re-export for convenience
import { authApi } from './auth.api';
import { rulesApi } from './rules.api';
import { ruleFunctionsApi } from './rule-functions.api';
import { ruleFunctionStepsApi } from './rule-function-steps.api';
import { categoriesApi } from './categories.api';
import { subfunctionsApi } from './subfunctions.api';

export const api = {
  auth: authApi,
  rules: rulesApi,
  ruleFunctions: ruleFunctionsApi,
  ruleFunctionSteps: ruleFunctionStepsApi,
  categories: categoriesApi,
  subfunctions: subfunctionsApi,
};
