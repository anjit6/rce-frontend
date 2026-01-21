// Defining types locally for self-containment if the project doesn't have them strict yet.
// In a real app we'd import these.
export interface RuleInputParam {
    id: number | string; // Changed to support "desc-1"
    name: string;
    dataType: string;
    mandatory?: string | boolean;
    sequence?: number; // Added
    paramType?: string; // Added
    fieldType?: string; // Added
    default?: string; // Added
    description?: string; // Added
}

export interface StepData {
    responseType?: string; // For output - 'success' or 'error'
    type: 'static' | 'inputParam' | 'stepOutputVariable' | 'array';
    value: any;
    dataType?: string;
    errorCode?: string; // For output when responseType is 'error'
    errorMessage?: string; // For output when responseType is 'error'
}

export interface SubFuncParam {
    subFuncParamId: string; // Changed from number/optional to string specific
    name?: string; // Optional now
    data: StepData;
}

export interface SubFunctionDef {
    id: string; // STRING_REPLACE etc
    name?: string;
    inputParams: SubFuncParam[];
}

export interface RuleStep {
    id: string;
    type: 'subFunction' | 'condition' | 'output';
    outputVariableName?: string; // For subFunction
    returnType?: string; // Added
    subFunction?: SubFunctionDef;
    data?: StepData; // For output
    next?: string | null | Record<string, string | null>;
}

// Flattened Rule Interface (no RuleFunction wrapper)
export interface Rule {
    id: number;
    ruleId?: string; // Added
    name?: string; // Optional in new JSON? logic uses name usually
    code?: string; // Added
    returnType?: string; // Added

    // Flattened props
    inputParams: RuleInputParam[];
    steps: RuleStep[];

    // Legacy support (optional)
    slug?: string;
    ruleFunction?: {
        inputParams: RuleInputParam[];
        steps: RuleStep[];
        returnType: string;
    };
}

import { getAllSubfunctions } from './subfunctions';

const SUBFUNCTION_CODE: Record<string, string> = {};
const SUBFUNCTION_PARAMS_CONFIG: Record<string, { name: string, default: string }[]> = {};

// Initialize maps dynamically from the source of truth
const subfunctions = getAllSubfunctions();

subfunctions.forEach(fn => {
    SUBFUNCTION_CODE[fn.functionName] = fn.code;

    if (fn.inputParams) {
        SUBFUNCTION_PARAMS_CONFIG[fn.functionName] = fn.inputParams
            .sort((a, b) => a.sequence - b.sequence)
            .map(param => {
                let defVal = 'null';
                if (param.dataType === 'STRING') defVal = '""';
                else if (param.dataType === 'NUMBER') defVal = '0';
                else if (param.dataType === 'BOOLEAN') defVal = 'false';
                else if (param.dataType === 'DATE') defVal = '""';
                else if (param.default !== undefined) defVal = JSON.stringify(param.default);

                return {
                    name: param.name,
                    default: defVal
                };
            });
    }
});





/**
 * Compiles a Rule JSON object into an executable JavaScript function string.
 */
export function compileRule(rule: Rule): string {
    const id = rule.id;
    // Fallback logic for name if nested structure changes
    const name = rule.name || rule.ruleId || `rule_${id}`;

    let inputParams: RuleInputParam[] = [];
    let steps: RuleStep[] = [];

    if (rule.ruleFunction) {
        // Legacy Structure
        inputParams = rule.ruleFunction.inputParams || [];
        steps = rule.ruleFunction.steps || [];
    } else {
        // New Flat Structure
        inputParams = rule.inputParams || [];
        steps = rule.steps || [];
    }

    const functionName = `rule_${id}`;

    let code = `/**\n * Generated Rule Function\n * ID: ${id}\n * Name: ${name}\n */\n`;
    code += `async function ${functionName}(inputData) {\n`;

    // Inject used subfunctions
    const usedSubFunctions = new Set<string>();
    steps.forEach(step => {
        if (step.type === 'subFunction' && step.subFunction) {
            // Support both ID (new) and Name (legacy) for function identifier
            const funcName = step.subFunction.id || step.subFunction.name;
            if (funcName) usedSubFunctions.add(funcName);
        }
    });

    if (usedSubFunctions.size > 0) {
        code += `    // Subfunction Implementations\n`;
        usedSubFunctions.forEach(name => {
            if (SUBFUNCTION_CODE[name]) {
                code += SUBFUNCTION_CODE[name] + `\n`;
            } else {
                code += `    // Missing implementation for ${name}\n`;
            }
        });
        code += `\n`;
    }

    code += `    try {\n`;

    // 1. Extract Inputs
    code += `        // 1. Extract Inputs\n`;
    if (inputParams && inputParams.length > 0) {
        inputParams.forEach((param: RuleInputParam) => {
            code += `        const ${param.name} = inputData.${param.name};\n`;
        });
    }
    code += `\n`;

    // 2. Variable Declarations
    code += `        // 2. Variable Declarations\n`;
    const declaredVars = new Set<string>();
    steps.forEach(step => {
        if (step.type === 'subFunction' && step.outputVariableName) {
            if (!declaredVars.has(step.outputVariableName)) {
                code += `        let ${step.outputVariableName};\n`;
                declaredVars.add(step.outputVariableName);
            }
        }
    });
    code += `\n`;

    // 3. Execution Loop
    code += `        // 3. Execution Loop\n`;
    if (steps.length > 0) {
        code += `        let stepId = "${steps[0].id}";\n`;
        code += `        while (stepId) {\n`;
        code += `            switch (stepId) {\n`;

        steps.forEach((step, index) => {
            code += `                case "${step.id}":\n`;
            code += generateStepLogic(step);

            // Flow Control
            if (step.type === 'condition') {
                // Condition logic generated inside generateStepLogic handles 'stepId' assignment
                // No break needed here, condition logic handles it
            } else if (step.type === 'output') {
                // Output step already includes return statement, no need for stepId assignment
                code += `                    break;\n`;
            } else {
                if (typeof step.next === 'string' && step.next) {
                    code += `                    stepId = "${step.next}";\n`;
                } else if (!step.next && index < steps.length - 1) {
                    // Implicit linear flow (legacy)
                    code += `                    stepId = "${steps[index + 1].id}";\n`;
                } else {
                    code += `                    stepId = null;\n`;
                }
                code += `                    break;\n`;
            }
        });

        code += `                default:\n`;
        code += `                    stepId = null;\n`;
        code += `                    break;\n`;
        code += `            }\n`;
        code += `        }\n`;
    }

    code += `        return { success: false, error: { code: 400, message: "Rule execution finished without output" } };\n`;

    code += `    } catch (error) {\n`;
    code += `        return {\n`;
    code += `            success: false,\n`;
    code += `            error: {\n`;
    code += `                code: 500,\n`;
    code += `                message: error.message,\n`;
    code += `                stepId: error.stepId || "unknown"\n`;
    code += `            }\n`;
    code += `        };\n`;
    code += `    }\n`;
    code += `}\n`;

    return code;
}

function generateStepLogic(step: RuleStep): string {
    if (step.type === 'subFunction' && step.subFunction) {
        const { outputVariableName, subFunction } = step;
        const subFuncName = String(subFunction.id || subFunction.name);

        const args: string[] = [];
        if (subFunction.inputParams) {
            const paramMap: Record<string, string> = {};
            subFunction.inputParams.forEach((p, idx) => {
                // Map both by ID (new) and index (legacy fallback)
                const val = resolveValue(p.data);
                if (p.subFuncParamId) paramMap[p.subFuncParamId] = val;
                paramMap[String(idx)] = val;
                // Also map by name if available (legacy legacy)
                if (p.name) paramMap[p.name] = val;
            });

            // Use Configuration for Parameter Mapping
            const paramsConfig = SUBFUNCTION_PARAMS_CONFIG[subFuncName];

            if (paramsConfig) {
                // Config-driven mapping
                paramsConfig.forEach((paramConfig, index) => {
                    // Try ID-based match first, then index-based fallback
                    const val = paramMap[paramConfig.name] || paramMap[String(index)] || paramConfig.default;
                    args.push(val);
                });
            } else {
                // Generic/Legacy Fallback: use array order if no config found
                subFunction.inputParams.forEach(param => {
                    args.push(resolveValue(param.data));
                });
            }
        }
        return `                    ${outputVariableName} = ${subFuncName}(${args.join(', ')}).value;\n`;
    }

    if (step.type === 'output' && step.data) {
        const responseType = step.data.responseType || 'success';

        if (responseType === 'error') {
            const errorMessage = step.data.errorMessage ? JSON.stringify(step.data.errorMessage) : '""';
            return `                    return {\n                        success: false,\n                        error: {\n                            code: 400,\n                            message: ${errorMessage},\n                            isUserError: true\n                        }\n                    };\n`;
        } else {
            const outputVal = resolveValue(step.data);
            return `                    return {\n                        success: true,\n                        value: ${outputVal}\n                    };\n`;
        }
    }

    if (step.type === 'condition') {
        let logic = ``;
        const conditions = (step as any).conditions;

        if (conditions && Array.isArray(conditions) && conditions.length > 0) {
            const cond = conditions[0];
            const lhs = resolveValue(cond.lhs);
            const rhs = resolveValue(cond.rhs);
            const op = cond.operator;

            logic += `                    // Condition: ${lhs} ${op} ${rhs}\n`;

            if (op === 'equals') {
                logic += `                    if (${lhs} == ${rhs}) {\n`;
            } else if (op === 'OR') {
                logic += `                    if ([${rhs}].flat().includes(${lhs})) {\n`;
            } else {
                logic += `                    if (${lhs} == ${rhs}) {\n`;
            }
        } else {
            logic += `                    if (true) {\n`;
        }

        if (step.next && typeof step.next === 'object') {
            const trueStep = (step.next as any)['true'];
            const falseStep = (step.next as any)['false'];
            logic += `                        stepId = "${trueStep}";\n`;
            logic += `                    } else {\n`;
            logic += `                        stepId = "${falseStep}";\n`;
            logic += `                    }\n`;
            logic += `                    break;\n`;
        }
        return logic;
    }

    return `                    // Unknown step type: ${step.type}\n`;
}

function resolveValue(data: StepData): string {
    if (data.type === 'static') {
        if (typeof data.value === 'string') {
            return JSON.stringify(data.value);
        }
        return String(data.value);
    }
    if (data.type === 'inputParam') {
        return data.value;
    }
    if (data.type === 'stepOutputVariable') {
        return data.value;
    }
    if (data.type === 'array') {
        if (Array.isArray(data.value)) {
            const elements = data.value.map((item: any) => resolveValue(item));
            return `[${elements.join(', ')}]`;
        }
    }
    return 'null';
}
