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

    // Normalize API format: convert next_step to next
    steps = steps.map(step => {
        const normalizedStep = { ...step };
        if ((step as any).next_step && !step.next) {
            normalizedStep.next = (step as any).next_step;
        }
        return normalizedStep;
    });

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
        // Find the starting step - it's the step that is not referenced by any other step's next
        const referencedSteps = new Set<string>();
        steps.forEach(step => {
            if (typeof step.next === 'string' && step.next) {
                referencedSteps.add(step.next);
            } else if (step.next && typeof step.next === 'object') {
                const nextObj = step.next as Record<string, string | null>;
                Object.values(nextObj).forEach(nextId => {
                    if (nextId) referencedSteps.add(nextId);
                });
            }
        });

        // The starting step is one that's not referenced by any other step
        const startingStep = steps.find(step => !referencedSteps.has(step.id));
        const startingStepId = startingStep ? startingStep.id : steps[0].id;

        code += `        let stepId = "${startingStepId}";\n`;
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
        // Generate code that checks success before accessing .value
        return `                    const ${outputVariableName}_result = ${subFuncName}(${args.join(', ')});\n` +
               `                    if (!${outputVariableName}_result.success) {\n` +
               `                        return ${outputVariableName}_result;\n` +
               `                    }\n` +
               `                    ${outputVariableName} = ${outputVariableName}_result.value;\n`;
    }

    if (step.type === 'output') {
        // Handle both formats: step.data (object format) or step.output_data (API format)
        const outputData = step.data || (step as any).output_data;

        if (!outputData) {
            return `                    return { success: false, error: { code: 500, message: "Output step missing data" } };\n`;
        }

        // Transform API format to expected format if needed
        const stepData = outputData.data_type ? {
            type: outputData.data_type,
            value: outputData.data_value,
            dataType: outputData.data_value_type,
            responseType: outputData.response_type || 'success',
            errorMessage: outputData.error_message || ''
        } : outputData;

        const responseType = stepData.responseType || 'success';

        if (responseType === 'error') {
            const errorMessage = stepData.errorMessage ? JSON.stringify(stepData.errorMessage) : '""';
            return `                    return {\n                        success: false,\n                        error: {\n                            code: 400,\n                            message: ${errorMessage},\n                            isUserError: true\n                        }\n                    };\n`;
        } else {
            const outputVal = resolveValue(stepData);
            return `                    return {\n                        success: true,\n                        value: ${outputVal}\n                    };\n`;
        }
    }

    if (step.type === 'condition') {
        let logic = ``;
        const conditions = (step as any).conditions;

        if (conditions && Array.isArray(conditions) && conditions.length > 0) {
            // Handle all conditions, not just the first one
            const conditionExpressions: string[] = [];

            conditions.forEach((cond: any, index: number) => {
                // Handle both API format (lhs_type/lhs_value) and object format (lhs: {type, value})
                const lhsData = cond.lhs || { type: cond.lhs_type, value: cond.lhs_value, dataType: cond.lhs_data_type };
                const rhsData = cond.rhs || { type: cond.rhs_type, value: cond.rhs_value, dataType: cond.rhs_data_type };

                const lhs = resolveValue(lhsData);
                const rhs = resolveValue(rhsData);
                const op = cond.operator;

                logic += `                    // Condition ${index + 1}: ${lhs} ${op} ${rhs}\n`;

                let condExpr: string;
                if (op === 'equals') {
                    condExpr = `(${lhs} == ${rhs})`;
                } else if (op === 'OR') {
                    condExpr = `([${rhs}].flat().includes(${lhs}))`;
                } else if (op === 'not_equals') {
                    condExpr = `(${lhs} != ${rhs})`;
                } else if (op === 'greater_than') {
                    condExpr = `(${lhs} > ${rhs})`;
                } else if (op === 'less_than') {
                    condExpr = `(${lhs} < ${rhs})`;
                } else if (op === 'greater_than_or_equal') {
                    condExpr = `(${lhs} >= ${rhs})`;
                } else if (op === 'less_than_or_equal') {
                    condExpr = `(${lhs} <= ${rhs})`;
                } else {
                    // Default to equals for unknown operators
                    condExpr = `(${lhs} == ${rhs})`;
                }

                conditionExpressions.push(condExpr);
            });

            // Combine all conditions with AND logic (all must be true)
            const combinedCondition = conditionExpressions.join(' && ');
            logic += `                    if (${combinedCondition}) {\n`;
        } else {
            logic += `                    if (true) {\n`;
        }

        if (step.next && typeof step.next === 'object') {
            const trueStep = (step.next as any)['true'];
            const falseStep = (step.next as any)['false'];

            // Add null safety checks for branch steps
            if (trueStep !== undefined && trueStep !== null) {
                logic += `                        stepId = "${trueStep}";\n`;
            } else {
                logic += `                        stepId = null; // No true branch defined\n`;
            }

            logic += `                    } else {\n`;

            if (falseStep !== undefined && falseStep !== null) {
                logic += `                        stepId = "${falseStep}";\n`;
            } else {
                logic += `                        stepId = null; // No false branch defined\n`;
            }

            logic += `                    }\n`;
            logic += `                    break;\n`;
        } else {
            // Missing step.next structure - add error handling
            logic += `                        return { success: false, error: { code: 500, message: "Condition step ${step.id} missing next branches" } };\n`;
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
