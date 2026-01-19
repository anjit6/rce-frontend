// Rule types
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

export interface RuleFunctionConfig {
    subfunctionId: number;
    subfunctionName: string;
    parameterMappings: {
        paramName: string;
        mappedTo: string; // ID of input parameter
        value?: string; // For static values
    }[];
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
    // Additional fields
    type: RuleType;
    mappingCount: number;
    // Configuration fields
    inputParameters?: RuleInputParameter[];
    functions?: RuleFunctionConfig[];
    outputVariable?: string;
    subRules?: SubRule[];
    // Rule function configuration (JSON structure)
    ruleFunction?: any;
}

// Legacy type alias for backward compatibility
export type RuleStage = RuleStatus;

export interface SubRule {
    id: string;
    name: string;
    condition: RuleCondition;
    action: RuleAction;
    order: number;
}

export interface RuleCondition {
    type: 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'regex' | 'characterPosition' | 'length';
    value: string;
    additionalParams?: Record<string, unknown>;
}

export interface RuleAction {
    type: 'replace' | 'insert' | 'remove' | 'transform' | 'concatenate';
    value: string;
    additionalParams?: Record<string, unknown>;
}

// Initial mock data with sample rules (empty by default)
export const initialRules: Rule[] = [];

// LocalStorage key for persisting rules
const RULES_STORAGE_KEY = 'rce_rules_data';

// Load rules from localStorage
const loadRulesFromLocalStorage = (): Rule[] => {
    try {
        const stored = localStorage.getItem(RULES_STORAGE_KEY);
        if (stored) {
            const parsedRules = JSON.parse(stored) as Rule[];
            // Merge with initialRules, avoiding duplicates by ID
            const existingIds = new Set(initialRules.map(r => r.id));
            const newRules = parsedRules.filter(r => !existingIds.has(r.id));
            return [...initialRules, ...newRules];
        }
    } catch (error) {
        console.error('Failed to load rules from localStorage:', error);
    }
    return [...initialRules];
};

// Save rules to localStorage
const saveRulesToLocalStorage = (): void => {
    try {
        // Only save user-created rules (not the initial sample rules)
        const initialIds = new Set(initialRules.map(r => r.id));
        const userCreatedRules = rulesData.filter(r => !initialIds.has(r.id));
        localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(userCreatedRules));
    } catch (error) {
        console.error('Failed to save rules to localStorage:', error);
    }
};

// Rules store using closure for state management
let rulesData: Rule[] = loadRulesFromLocalStorage();

// Generate unique ID
const generateId = (): number => {
    return Math.floor(100000 + Math.random() * 900000);
};

// Generate slug from name
const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// Get all rules (exclude deleted rules)
export const getRules = (): Rule[] => {
    return rulesData.filter(rule => !rule.deletedAt);
};

// Get rule by ID
export const getRuleById = (id: number | string): Rule | undefined => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    return rulesData.find(rule => rule.id === numericId && !rule.deletedAt);
};

// Add new rule and persist to initialRules
export const addRule = (ruleData: {
    name: string;
    description: string;
    type: RuleType;
    author?: string;
}): Rule => {
    const now = new Date().toISOString();
    const newRule: Rule = {
        id: generateId(),
        slug: generateSlug(ruleData.name),
        name: ruleData.name,
        description: ruleData.description,
        status: 'WIP',
        version: { major: 0, minor: 1 },
        author: ruleData.author || '',
        createdAt: now,
        updatedAt: now,
        deletedAt: '',
        type: ruleData.type,
        mappingCount: 0,
        inputParameters: [],
        functions: [],
        outputVariable: ''
    };

    // Add to runtime data
    rulesData = [newRule, ...rulesData];

    // Save to localStorage for persistence across page refreshes
    saveRulesToLocalStorage();

    return newRule;
};

// Update rule and persist changes
export const updateRule = (id: number | string, updates: Partial<Rule>): Rule | undefined => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const index = rulesData.findIndex(rule => rule.id === numericId);
    if (index === -1) return undefined;

    rulesData[index] = {
        ...rulesData[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    // Persist changes to localStorage
    saveRulesToLocalStorage();

    return rulesData[index];
};

// Delete rule (soft delete) and persist
export const deleteRule = (id: number | string): boolean => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const index = rulesData.findIndex(rule => rule.id === numericId);
    if (index === -1) return false;

    rulesData[index].deletedAt = new Date().toISOString();

    // Persist changes to localStorage
    saveRulesToLocalStorage();

    return true;
};

// Reset to initial data (for testing)
export const resetRules = (): void => {
    rulesData = [...initialRules];
    localStorage.removeItem(RULES_STORAGE_KEY);
};
