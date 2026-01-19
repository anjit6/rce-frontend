import { rulesApi, Rule as ApiRule, CreateRuleDto, UpdateRuleDto, RuleStatus as ApiRuleStatus } from '../api';

// Frontend types for compatibility with existing components
export type RuleStatus = 'WIP' | 'TEST' | 'PENDING' | 'PROD';
export type RuleType = 'static' | 'dynamic';

export interface RuleVersion {
  major: number;
  minor: number;
}

export interface RuleInputParameter {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface Rule {
  id: number;
  slug: string;
  name: string;
  description: string;
  status: RuleStatus;
  version: RuleVersion;
  author: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  type: RuleType;
  mappingCount: number;
  inputParameters?: RuleInputParameter[];
  outputVariable?: string;
  ruleFunction?: any;
}

// Backend and frontend now use the same status values: WIP, TEST, PENDING, PROD
// No mapping needed - direct pass-through
const mapBackendStatus = (backendStatus: ApiRuleStatus): RuleStatus => {
  return backendStatus as RuleStatus;
};

const mapFrontendStatus = (frontendStatus: RuleStatus): ApiRuleStatus => {
  return frontendStatus as ApiRuleStatus;
};

// Convert backend API rule to frontend rule format
const convertApiRuleToFrontend = (apiRule: ApiRule, type: RuleType = 'dynamic'): Rule => {
  return {
    id: apiRule.id,
    slug: apiRule.slug,
    name: apiRule.name,
    description: apiRule.description || '',
    status: mapBackendStatus(apiRule.status),
    version: {
      major: apiRule.version_major,
      minor: apiRule.version_minor,
    },
    author: apiRule.author || '',
    createdAt: apiRule.created_at,
    updatedAt: apiRule.updated_at,
    deletedAt: apiRule.deleted_at || '',
    type,
    mappingCount: 0,
    inputParameters: [],
    outputVariable: '',
  };
};

// Generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Rules Service
export const rulesService = {
  /**
   * Get all rules
   */
  async getRules(page: number = 1, limit: number = 100, search?: string, status?: RuleStatus): Promise<Rule[]> {
    try {
      // Map frontend status to backend status for API call
      const apiStatus = status ? mapFrontendStatus(status) : undefined;
      const response = await rulesApi.getAll({ page, limit, search, status: apiStatus });
      return response.data.map(apiRule => convertApiRuleToFrontend(apiRule));
    } catch (error) {
      console.error('Failed to fetch rules:', error);
      throw error;
    }
  },

  /**
   * Get rule by ID
   */
  async getRuleById(id: number | string): Promise<Rule | undefined> {
    try {
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      const apiRule = await rulesApi.getById(numericId);
      return convertApiRuleToFrontend(apiRule);
    } catch (error) {
      console.error(`Failed to fetch rule ${id}:`, error);
      return undefined;
    }
  },

  /**
   * Create a new rule
   */
  async addRule(ruleData: {
    name: string;
    description: string;
    type: RuleType;
    author?: string;
  }): Promise<Rule> {
    try {
      const createDto: CreateRuleDto = {
        slug: generateSlug(ruleData.name),
        name: ruleData.name,
        description: ruleData.description,
        status: 'WIP',
        version_major: 0,
        version_minor: 1,
        author: ruleData.author || '',
      };

      const apiRule = await rulesApi.create(createDto);
      return convertApiRuleToFrontend(apiRule, ruleData.type);
    } catch (error) {
      console.error('Failed to create rule:', error);
      throw error;
    }
  },

  /**
   * Update a rule
   */
  async updateRule(id: number | string, updates: Partial<Rule>): Promise<Rule | undefined> {
    try {
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

      const updateDto: UpdateRuleDto = {};

      if (updates.name !== undefined) updateDto.name = updates.name;
      if (updates.description !== undefined) updateDto.description = updates.description;
      if (updates.slug !== undefined) updateDto.slug = updates.slug;
      if (updates.author !== undefined) updateDto.author = updates.author;
      if (updates.status !== undefined) {
        const mappedStatus = mapFrontendStatus(updates.status);
        if (mappedStatus !== undefined) {
          updateDto.status = mappedStatus;
        }
      }
      if (updates.version !== undefined) {
        updateDto.version_major = updates.version.major;
        updateDto.version_minor = updates.version.minor;
      }

      const apiRule = await rulesApi.update(numericId, updateDto);
      return convertApiRuleToFrontend(apiRule, updates.type);
    } catch (error) {
      console.error(`Failed to update rule ${id}:`, error);
      return undefined;
    }
  },

  /**
   * Delete a rule (soft delete)
   */
  async deleteRule(id: number | string): Promise<boolean> {
    try {
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      await rulesApi.delete(numericId);
      return true;
    } catch (error) {
      console.error(`Failed to delete rule ${id}:`, error);
      return false;
    }
  },
};

// Export legacy functions for backward compatibility
export const getRules = rulesService.getRules;
export const getRuleById = rulesService.getRuleById;
export const addRule = rulesService.addRule;
export const updateRule = rulesService.updateRule;
export const deleteRule = rulesService.deleteRule;
