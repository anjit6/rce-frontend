import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Collapse, Modal, Tooltip, Select, message } from 'antd';
import { PlusOutlined, CloseOutlined, SearchOutlined, ExclamationCircleOutlined, CloseCircleFilled, CheckOutlined, CopyOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import Layout from '../../components/layout/Layout';
import { rulesService } from '../../services/rules.service';
import { subfunctionsService, Subfunction } from '../../services/subfunctions.service';
import { ruleFunctionsApi, ruleFunctionStepsApi, CreateRuleFunctionStepDto } from '../../api';
import { InputParameter, FunctionType, ConfigurationStep } from '../../types/rule-configuration';
import RuleConfigurationCard from '../../components/rules/RuleConfigurationCard';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { compileRule } from '../../utils/ruleCompiler';
import { assignStepIds } from '../../utils/stepIdGenerator';

const { Panel } = Collapse;
const { confirm } = Modal;

// localStorage helper functions
const saveRuleConfiguration = (config: any) => {
    try {
        const existingConfigs = localStorage.getItem('rce_rule_configurations');
        const configurations = existingConfigs ? JSON.parse(existingConfigs) : {};
        configurations[config.ruleId] = config;
        localStorage.setItem('rce_rule_configurations', JSON.stringify(configurations));
    } catch (error) {
        console.error('Failed to save configuration to localStorage:', error);
    }
};

// Utility function to find all usages of an input parameter in configuration steps
const findInputParamUsages = (
    paramName: string,
    steps: ConfigurationStep[]
): { stepId: string; location: string }[] => {
    const usages: { stepId: string; location: string }[] = [];

    const searchInSteps = (stepsToSearch: ConfigurationStep[], pathPrefix: string = '') => {
        stepsToSearch.forEach((step, index) => {
            const stepPath = pathPrefix ? `${pathPrefix} > Step ${index + 1}` : `Step ${index + 1}`;

            if (step.type === 'subfunction' && step.config?.params) {
                step.config.params.forEach((param: any, paramIdx: number) => {
                    if (param.type === paramName) {
                        usages.push({ stepId: step.id, location: `${stepPath} (Parameter ${paramIdx + 1})` });
                    }
                });
            } else if (step.type === 'conditional' && step.config?.conditions) {
                step.config.conditions.forEach((condition: any, condIdx: number) => {
                    if (condition.lhs?.type === paramName) {
                        usages.push({ stepId: step.id, location: `${stepPath} (Condition ${condIdx + 1} LHS)` });
                    }
                    if (condition.rhs?.type === paramName) {
                        usages.push({ stepId: step.id, location: `${stepPath} (Condition ${condIdx + 1} RHS)` });
                    }
                });
                // Search in true/false branches
                if (step.config.next?.true) {
                    searchInSteps(step.config.next.true, `${stepPath} > TRUE`);
                }
                if (step.config.next?.false) {
                    searchInSteps(step.config.next.false, `${stepPath} > FALSE`);
                }
            } else if (step.type === 'output' && step.config?.value === paramName) {
                usages.push({ stepId: step.id, location: `${stepPath} (Output)` });
            }
        });
    };

    searchInSteps(steps);
    return usages;
};

// Utility function to update all references to an input parameter name in steps
const updateParamReferencesInSteps = (
    oldParamName: string,
    newParamName: string,
    steps: ConfigurationStep[]
): ConfigurationStep[] => {
    return steps.map(step => {
        if (step.type === 'subfunction' && step.config?.params) {
            const updatedParams = step.config.params.map((param: any) => {
                if (param.type === oldParamName) {
                    return { ...param, type: newParamName };
                }
                return param;
            });
            return { ...step, config: { ...step.config, params: updatedParams } };
        } else if (step.type === 'conditional') {
            let updatedConfig = { ...step.config };

            // Update conditions
            if (step.config?.conditions) {
                const updatedConditions = step.config.conditions.map((condition: any) => {
                    let updated = { ...condition };
                    if (condition.lhs?.type === oldParamName) {
                        updated.lhs = { ...condition.lhs, type: newParamName, value: newParamName };
                    }
                    if (condition.rhs?.type === oldParamName) {
                        updated.rhs = { ...condition.rhs, type: newParamName, value: newParamName };
                    }
                    return updated;
                });
                updatedConfig.conditions = updatedConditions;
            }

            // Update nested branches
            if (step.config?.next) {
                updatedConfig.next = {
                    true: step.config.next.true ? updateParamReferencesInSteps(oldParamName, newParamName, step.config.next.true) : [],
                    false: step.config.next.false ? updateParamReferencesInSteps(oldParamName, newParamName, step.config.next.false) : []
                };
            }

            return { ...step, config: updatedConfig };
        } else if (step.type === 'output' && step.config?.value === oldParamName) {
            return { ...step, config: { ...step.config, value: newParamName } };
        }
        return step;
    });
};

export default function RuleCreatePage() {
    const { ruleId } = useParams<{ ruleId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [rule, setRule] = useState<any>(null);
    const [isViewMode, setIsViewMode] = useState(false); // Default to edit mode
    const [configurationStarted, setConfigurationStarted] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [configurationSteps, setConfigurationSteps] = useState<ConfigurationStep[]>([]);
    const [inputParameters, setInputParameters] = useState<InputParameter[]>([
        { id: '1', name: 'Input Parameter 1', fieldName: '', type: 'Variable Data Field', dataType: 'String' }
    ]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeAccordionKeys, setActiveAccordionKeys] = useState<string[]>([]);
    const [parameterErrors, setParameterErrors] = useState<Record<string, { type?: boolean; fieldName?: boolean; dataType?: boolean; duplicate?: boolean }>>({});
    const [isCopied, setIsCopied] = useState(false);
    const [generatedJsCode, setGeneratedJsCode] = useState<string>('');
    const [testInputs, setTestInputs] = useState<Record<string, any>>({});
    const [testResult, setTestResult] = useState<any>(null);
    const [isTestRunning, setIsTestRunning] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(false);
    const [rightPanelContent, setRightPanelContent] = useState<'js' | 'test' | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [stepValidationErrors, setStepValidationErrors] = useState<Record<string, boolean>>({});
    const [showStepValidation, setShowStepValidation] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [subfunctions, setSubfunctions] = useState<Subfunction[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [zoomLevel, setZoomLevel] = useState(100); // Default zoom level 100%
    const [showConfiguration, setShowConfiguration] = useState(false); // Controls empty state visibility

    // Helper function to update configuration steps with automatic step ID assignment
    const updateConfigurationSteps = (steps: ConfigurationStep[] | ((prev: ConfigurationStep[]) => ConfigurationStep[])) => {
        if (typeof steps === 'function') {
            const newSteps = assignStepIds(steps(configurationSteps));
            setConfigurationSteps(newSteps);
            if (newSteps.length > 0) {
                setShowConfiguration(true);
            }
        } else {
            const newSteps = assignStepIds(steps);
            setConfigurationSteps(newSteps);
            if (newSteps.length > 0) {
                setShowConfiguration(true);
            }
        }
    };

    // Fetch subfunctions from API on component mount
    useEffect(() => {
        const fetchSubfunctions = async () => {
            try {
                const data = await subfunctionsService.getSubfunctions();
                setSubfunctions(data);
            } catch (error) {
                console.error('Failed to fetch subfunctions:', error);
                message.error('Failed to load subfunctions');
            }
        };

        fetchSubfunctions();
    }, []);

    useEffect(() => {
        if (ruleId) {
            const loadRuleData = async () => {
                try {

                    // Load rule metadata from API
                    const ruleData = await rulesService.getRuleById(parseInt(ruleId));
                    if (!ruleData) {
                        message.error('Rule not found');
                        navigate('/rules');
                        return;
                    }

                    setRule(ruleData);
                    document.title = `${ruleData.name} - RCE`;

                    // Check if this is a newly created rule from navigation state
                    const isNewRule = (location.state as any)?.isNewRule;

                    // Try to load configuration from API first
                    try {
                        console.log("🔄 Loading configuration from API...");
                        const ruleFunction = await ruleFunctionsApi.getByRuleId(ruleData.id);
                        const steps = await ruleFunctionStepsApi.getByRuleFunctionId(ruleFunction.id, { limit: 1000 });

                        console.log("📂 Loading saved configuration from API for rule:", ruleId);

                        // Restore input parameters from rule function
                        if (ruleFunction.input_params && ruleFunction.input_params.length > 0) {
                            const apiInputParams = ruleFunction.input_params.map((param, index) => ({
                                id: String(Date.now() + index),
                                name: `Input Parameter ${index + 1}`,
                                fieldName: param.name,
                                type: param.param_type === 'inputField' ? 'VD Field' : 'Fixed Field',
                                dataType: param.data_type.charAt(0).toUpperCase() + param.data_type.slice(1)
                            }));
                            setInputParameters(apiInputParams);
                            console.log("✅ Input parameters restored from API:", apiInputParams.length, "parameters");
                        }

                        // Restore configuration steps from API
                        if (steps.data && steps.data.length > 0) {
                            console.log("🔄 Converting API steps to frontend format...");

                            // Helper function to build nested tree structure from flat API steps
                            const buildNestedSteps = (apiSteps: any[], inputParams: InputParameter[]): ConfigurationStep[] => {
                                // First, track ALL referenced steps (both linear next_step and conditional branches)
                                const referencedStepIds = new Set<string>();
                                apiSteps.forEach((apiStep: any) => {
                                    if (apiStep.next_step) {
                                        if (typeof apiStep.next_step === 'string') {
                                            // Linear next step
                                            referencedStepIds.add(apiStep.next_step);
                                        } else if (typeof apiStep.next_step === 'object') {
                                            // Conditional branches
                                            if (apiStep.next_step.true) referencedStepIds.add(apiStep.next_step.true);
                                            if (apiStep.next_step.false) referencedStepIds.add(apiStep.next_step.false);
                                        }
                                    }
                                });

                                // Now convert all API steps to UI format and create a map
                                const stepsMap = new Map<string, ConfigurationStep>();

                                apiSteps.forEach((apiStep: any) => {
                                    let convertedStep: ConfigurationStep | null = null;

                                    if (apiStep.type === 'subFunction') {
                                        const params = apiStep.subfunction_params?.map((apiParam: any) => {
                                            if (apiParam.data_type === 'static') {
                                                return {
                                                    type: 'Static Value',
                                                    dataType: 'STRING',
                                                    value: apiParam.data_value
                                                };
                                            } else if (apiParam.data_type === 'inputParam') {
                                                const matchingInputParam = inputParams.find(ip => ip.fieldName === apiParam.data_value);
                                                return {
                                                    type: matchingInputParam?.name || apiParam.data_value,
                                                    value: ''
                                                };
                                            } else if (apiParam.data_type === 'stepOutputVariable') {
                                                return {
                                                    type: apiParam.data_value,
                                                    value: ''
                                                };
                                            }
                                            return { type: '', value: '' };
                                        }) || [];

                                        convertedStep = {
                                            id: apiStep.id,
                                            type: 'subfunction' as const,
                                            subfunctionId: apiStep.subfunction_id,
                                            config: {
                                                outputVariable: apiStep.output_variable_name || '',
                                                params: params
                                            }
                                        };
                                    } else if (apiStep.type === 'condition') {
                                        convertedStep = {
                                            id: apiStep.id,
                                            type: 'conditional' as const,
                                            config: {
                                                conditions: apiStep.conditions?.map((cond: any) => ({
                                                    id: cond.id || String(Date.now() + Math.random()),
                                                    sequence: cond.sequence,
                                                    andOr: cond.and_or,
                                                    lhs: {
                                                        type: cond.lhs_type,
                                                        dataType: cond.lhs_data_type,
                                                        value: cond.lhs_value
                                                    },
                                                    operator: cond.operator,
                                                    rhs: {
                                                        type: cond.rhs_type,
                                                        dataType: cond.rhs_data_type,
                                                        value: cond.rhs_value
                                                    }
                                                })) || [],
                                                next: {
                                                    true: [],
                                                    false: []
                                                }
                                            }
                                        };
                                    } else if (apiStep.type === 'output') {
                                        const outputData = apiStep.output_data;
                                        let uiValue = '';
                                        let staticValue = '';

                                        if (outputData?.data_type === 'static') {
                                            uiValue = 'Static Value';
                                            staticValue = outputData.data_value || '';
                                        } else if (outputData?.data_type === 'inputParam') {
                                            const matchingInputParam = inputParams.find(ip => ip.fieldName === outputData.data_value);
                                            uiValue = matchingInputParam?.name || outputData.data_value;
                                        } else if (outputData?.data_type === 'stepOutputVariable') {
                                            uiValue = outputData.data_value || '';
                                        }

                                        const dataType = outputData?.data_value_type
                                            ? outputData.data_value_type.charAt(0).toUpperCase() + outputData.data_value_type.slice(1)
                                            : 'String';

                                        convertedStep = {
                                            id: apiStep.id,
                                            type: 'output' as const,
                                            config: {
                                                responseType: 'success',
                                                type: outputData?.data_type || 'static',
                                                dataType: dataType,
                                                value: uiValue,
                                                staticValue: staticValue,
                                                errorMessage: '',
                                                errorCode: ''
                                            }
                                        };
                                    }

                                    if (convertedStep) {
                                        stepsMap.set(apiStep.id, convertedStep);
                                    }
                                });

                                // Helper function to collect steps in a branch by following next_step chain
                                const collectBranchSteps = (startStepId: string | null): ConfigurationStep[] => {
                                    if (!startStepId) return [];

                                    const branchSteps: ConfigurationStep[] = [];
                                    let currentStepId: string | null = startStepId;
                                    const visited = new Set<string>();

                                    while (currentStepId && !visited.has(currentStepId)) {
                                        visited.add(currentStepId);

                                        const apiStep = apiSteps.find(s => s.id === currentStepId);
                                        const convertedStep = stepsMap.get(currentStepId);

                                        if (!apiStep || !convertedStep) break;

                                        // Clone the step to avoid mutations
                                        const stepCopy = { ...convertedStep, config: { ...convertedStep.config } };

                                        // If this is a conditional, recursively build its branches
                                        if (stepCopy.type === 'conditional' && typeof apiStep.next_step === 'object') {
                                            const trueSteps = collectBranchSteps(apiStep.next_step.true);
                                            const falseSteps = collectBranchSteps(apiStep.next_step.false);

                                            stepCopy.config = {
                                                ...stepCopy.config,
                                                next: {
                                                    true: trueSteps,
                                                    false: falseSteps
                                                }
                                            };
                                        }

                                        branchSteps.push(stepCopy);

                                        // Move to next step (for non-conditionals or after conditional)
                                        if (stepCopy.type === 'conditional') {
                                            break; // Conditionals don't have a linear next_step
                                        } else {
                                            currentStepId = typeof apiStep.next_step === 'string' ? apiStep.next_step : null;
                                        }
                                    }

                                    return branchSteps;
                                };

                                // Find the root step (first step that is not referenced by any other step)
                                // There should typically be only one root step at the top level
                                const rootApiSteps = apiSteps.filter(s => !referencedStepIds.has(s.id));

                                if (rootApiSteps.length > 0) {
                                    // Build the complete chain starting from the first root
                                    const rootApiStep = rootApiSteps[0];
                                    const result = collectBranchSteps(rootApiStep.id);
                                    return result;
                                }

                                // Fallback: if no root found, return empty array
                                console.warn("⚠️ No root step found in API data");
                                return [];
                            };

                            const convertedSteps = buildNestedSteps(steps.data, inputParameters);

                            // Debug logging for structure verification
                            console.log("📊 API Steps Count:", steps.data.length);
                            console.log("🌳 Root-level Converted Steps:", convertedSteps.length);
                            console.log("🔍 Structure Preview:", JSON.stringify(convertedSteps.map(s => ({
                                id: s.id,
                                type: s.type,
                                stepId: s.stepId,
                                hasConditionalBranches: s.type === 'conditional' && s.config?.next,
                                trueBranchCount: s.type === 'conditional' ? (s.config?.next?.true?.length || 0) : 0,
                                falseBranchCount: s.type === 'conditional' ? (s.config?.next?.false?.length || 0) : 0
                            })), null, 2));

                            updateConfigurationSteps(convertedSteps);
                            setConfigurationStarted(true);
                            setShowConfiguration(true);
                            console.log("✅ Configuration steps restored from API:", convertedSteps.length, "steps");
                        }

                        // Store the generated code
                        if (ruleFunction.code) {
                            setGeneratedJsCode(ruleFunction.code);
                            console.log("✅ Generated JavaScript code loaded from API");
                        }

                        setHasUnsavedChanges(false);
                        setConfigurationStarted(steps.data.length > 0);
                        console.log("✅ Configuration loaded from API successfully!");
                    } catch (apiError: any) {
                        // If API load fails, fall back to localStorage
                        console.log("ℹ️ No configuration found in API, trying localStorage...", apiError.message);

                        const savedConfig = localStorage.getItem('rce_rule_configurations');
                        if (savedConfig) {
                            try {
                                const configurations = JSON.parse(savedConfig);
                                const ruleConfig = configurations[ruleId];

                                if (ruleConfig) {
                                    console.log("📂 Loading saved configuration from localStorage for rule:", ruleId);
                                    console.log("Saved config:", ruleConfig);

                                    // Restore input parameters
                                    if (ruleConfig.inputParameters && ruleConfig.inputParameters.length > 0) {
                                        setInputParameters(ruleConfig.inputParameters);
                                        console.log("✅ Input parameters restored from localStorage:", ruleConfig.inputParameters.length, "parameters");
                                    }

                                    // Restore configuration steps
                                    if (ruleConfig.configurationSteps && ruleConfig.configurationSteps.length > 0) {
                                        updateConfigurationSteps(ruleConfig.configurationSteps);
                                        setConfigurationStarted(true);
                                        setShowConfiguration(true);
                                        console.log("✅ Configuration steps restored from localStorage:", ruleConfig.configurationSteps.length, "steps");
                                    }

                                    // Store the saved ruleFunction (including the generated code)
                                    if (ruleConfig.ruleFunction) {
                                        if (ruleConfig.ruleFunction.code) {
                                            setGeneratedJsCode(ruleConfig.ruleFunction.code);
                                            console.log("✅ Generated JavaScript code loaded from localStorage");
                                        }
                                    }

                                    setHasUnsavedChanges(false);
                                    console.log("✅ Configuration loaded from localStorage successfully!");
                                } else {
                                    console.log("ℹ️ No saved configuration found in localStorage for rule:", ruleId);
                                }
                            } catch (parseError) {
                                console.error("Failed to parse localStorage config:", parseError);
                            }
                        } else {
                            console.log("ℹ️ No configurations in localStorage");
                        }
                    }

                    // Set view mode based on whether it's a new rule
                    // New rules start in edit mode, existing rules start in view mode
                    setIsViewMode(!isNewRule);
                } catch (error) {
                    console.error('Failed to load rule:', error);
                    message.error('Failed to load rule');
                    navigate('/rules');
                }
            };

            loadRuleData();
        } else {
            // No ruleId means creating a brand new rule - edit mode
            setIsViewMode(false);
        }
    }, [ruleId, navigate, location]);

    // Update active accordion keys when modal opens or search query changes
    useEffect(() => {
        if (isConfigModalOpen) {
            // Recompute which sections have data
            const userDefinedRules: string[] = [];
            const stringFunctions = subfunctions.filter(func => func.categoryId === 'STR' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));
            const numberFunctions = subfunctions.filter(func => func.categoryId === 'NUM' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));
            const dateFunctions = subfunctions.filter(func => func.categoryId === 'DATE' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));
            const utilFunctions = subfunctions.filter(func => func.categoryId === 'UTIL' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));
            const conditionalFunctions = [
                { name: 'IF', type: 'conditional' as FunctionType },
            ].filter(func => func.name.toLowerCase().includes(searchQuery.toLowerCase()));

            // Determine which accordion should open
            const newActiveKeys: string[] = [];

            if (userDefinedRules.length > 0) {
                newActiveKeys.push('1');
            } else if (stringFunctions.length > 0) {
                newActiveKeys.push('2');
            } else if (numberFunctions.length > 0) {
                newActiveKeys.push('number');
            } else if (dateFunctions.length > 0) {
                newActiveKeys.push('3');
            } else if (conditionalFunctions.length > 0 || utilFunctions.length > 0) {
                newActiveKeys.push('5');
            }

            setActiveAccordionKeys(newActiveKeys);
        }
    }, [isConfigModalOpen, searchQuery, subfunctions]);

    // Helper function to renumber parameters sequentially
    const renumberParameters = (params: InputParameter[]) => {
        return params.map((param, index) => ({
            ...param,
            name: `Input Parameter ${index + 1}`
        }));
    };

    const addInputParameter = () => {
        const newParam: InputParameter = {
            id: Date.now().toString(),
            name: `Input Parameter ${inputParameters.length + 1}`,
            fieldName: '',
            type: 'VD Field',
            dataType: 'String'
        };
        const updatedParams = renumberParameters([...inputParameters, newParam]);
        setInputParameters(updatedParams);
        setHasUnsavedChanges(true);
    };

    const updateInputParameter = (id: string, field: 'fieldName' | 'type' | 'dataType', value: string) => {
        // Update the parameter
        const updatedParams = inputParameters.map(param =>
            param.id === id ? { ...param, [field]: value } : param
        );
        setInputParameters(updatedParams);

        // Check for duplicate field names if updating fieldName
        if (field === 'fieldName' && value.trim()) {
            const duplicateIds = updatedParams
                .filter(p => p.fieldName.trim().toLowerCase() === value.trim().toLowerCase())
                .map(p => p.id);

            if (duplicateIds.length > 1) {
                // Mark all duplicates with error
                setParameterErrors(prev => {
                    const newErrors = { ...prev };
                    duplicateIds.forEach(dupId => {
                        newErrors[dupId] = { ...newErrors[dupId], duplicate: true };
                    });
                    return newErrors;
                });
            } else {
                // Clear duplicate errors for all params with this field name
                setParameterErrors(prev => {
                    const newErrors = { ...prev };
                    // Clear duplicate flag for current param
                    if (newErrors[id]) {
                        newErrors[id] = { ...newErrors[id], duplicate: false };
                    }
                    // Also clear duplicate flag for any other param that was previously marked
                    Object.keys(newErrors).forEach(paramId => {
                        if (newErrors[paramId]?.duplicate) {
                            const param = updatedParams.find(p => p.id === paramId);
                            const hasDuplicates = updatedParams.filter(
                                p => p.id !== paramId && p.fieldName.trim().toLowerCase() === param?.fieldName.trim().toLowerCase()
                            ).length > 0;
                            if (!hasDuplicates) {
                                newErrors[paramId] = { ...newErrors[paramId], duplicate: false };
                            }
                        }
                    });
                    return newErrors;
                });
            }
        }

        // Clear error when user types (for non-duplicate errors)
        if (parameterErrors[id]?.[field] && field !== 'fieldName') {
            setParameterErrors(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    [field]: false
                }
            }));
        } else if (field === 'fieldName' && parameterErrors[id]?.fieldName) {
            // Clear the required field error when user types in fieldName
            setParameterErrors(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    fieldName: false
                }
            }));
        }

        // Mark as having unsaved changes
        setHasUnsavedChanges(true);
    };

    // Handle data type change with validation
    const handleDataTypeChange = (id: string, _oldDataType: string, newDataType: string) => {
        const param = inputParameters.find(p => p.id === id);
        if (!param) return;

        // Check if this parameter is used in any steps
        const usages = findInputParamUsages(param.name, configurationSteps);

        if (usages.length > 0) {
            // Show warning about data type change
            confirm({
                title: 'Change Data Type',
                icon: <ExclamationCircleOutlined className="text-yellow-600" />,
                content: (
                    <div>
                        <p className="mb-2">This parameter is used in the following locations:</p>
                        <ul className="list-disc pl-4 mb-2">
                            {usages.slice(0, 5).map((usage, idx) => (
                                <li key={idx} className="text-sm text-gray-600">{usage.location}</li>
                            ))}
                            {usages.length > 5 && (
                                <li className="text-sm text-gray-600">...and {usages.length - 5} more</li>
                            )}
                        </ul>
                        <p className="text-yellow-600 font-medium">Changing the data type may cause validation errors. Please verify and update the affected steps if needed.</p>
                    </div>
                ),
                okText: 'Change Anyway',
                okType: 'primary',
                cancelText: 'Cancel',
                centered: true,
                onOk() {
                    updateInputParameter(id, 'dataType', newDataType);
                },
                onCancel() {
                    // Do nothing
                },
            });
        } else {
            // No usages, just update directly
            updateInputParameter(id, 'dataType', newDataType);
        }
    };

    const removeInputParameter = (id: string) => {
        // Prevent removing if only one parameter left
        if (inputParameters.length <= 1) return;

        const param = inputParameters.find(p => p.id === id);
        if (!param) return;

        // Check if this parameter is used in any configuration steps
        const usages = findInputParamUsages(param.name, configurationSteps);

        if (usages.length > 0) {
            // Parameter is in use - show error and list locations
            Modal.error({
                title: 'Cannot Remove Parameter',
                content: (
                    <div>
                        <p className="mb-2">This parameter is currently being used in the following locations:</p>
                        <ul className="list-disc pl-4 mb-2">
                            {usages.slice(0, 5).map((usage, idx) => (
                                <li key={idx} className="text-sm text-gray-600">{usage.location}</li>
                            ))}
                            {usages.length > 5 && (
                                <li className="text-sm text-gray-600">...and {usages.length - 5} more</li>
                            )}
                        </ul>
                        <p className="text-red-600 font-medium">Please remove or modify these steps before deleting this parameter.</p>
                    </div>
                ),
                okText: 'OK',
                centered: true
            });
        } else {
            // Parameter not in use - confirm deletion
            confirm({
                title: 'Remove Input Parameter',
                icon: <ExclamationCircleOutlined className="text-red-600" />,
                content: 'Are you sure you want to remove this parameter?',
                okText: 'Yes, Remove',
                okType: 'danger',
                cancelText: 'Cancel',
                centered: true,
                onOk() {
                    const filteredParams = inputParameters.filter(param => param.id !== id);
                    const renumberedParams = renumberParameters(filteredParams);

                    // Update references in steps when renumbering
                    let updatedSteps = configurationSteps;
                    filteredParams.forEach((p, index) => {
                        const oldName = p.name;
                        const newName = `Input Parameter ${index + 1}`;
                        if (oldName !== newName) {
                            updatedSteps = updateParamReferencesInSteps(oldName, newName, updatedSteps);
                        }
                    });

                    setInputParameters(renumberedParams);
                    updateConfigurationSteps(updatedSteps);
                    setHasUnsavedChanges(true);
                },
                onCancel() {
                    // Do nothing on cancel
                },
            });
        }
    };

    const handleStartConfiguration = () => {
        // Validate input parameters
        const newErrors: Record<string, { type?: boolean; fieldName?: boolean; dataType?: boolean; duplicate?: boolean }> = {};
        let hasErrors = false;

        // Check for duplicate field names
        const fieldNameCounts: Record<string, string[]> = {};
        inputParameters.forEach(param => {
            const normalizedName = param.fieldName.trim().toLowerCase();
            if (normalizedName) {
                if (!fieldNameCounts[normalizedName]) {
                    fieldNameCounts[normalizedName] = [];
                }
                fieldNameCounts[normalizedName].push(param.id);
            }
        });

        inputParameters.forEach(param => {
            const paramErrors: { type?: boolean; fieldName?: boolean; dataType?: boolean; duplicate?: boolean } = {};

            if (!param.type) paramErrors.type = true;
            if (!param.fieldName.trim()) paramErrors.fieldName = true;
            if (!param.dataType) paramErrors.dataType = true;

            // Check for duplicates
            const normalizedName = param.fieldName.trim().toLowerCase();
            if (normalizedName && fieldNameCounts[normalizedName]?.length > 1) {
                paramErrors.duplicate = true;
            }

            if (Object.keys(paramErrors).length > 0) {
                newErrors[param.id] = paramErrors;
                hasErrors = true;
            }
        });

        if (hasErrors) {
            setParameterErrors(newErrors);
            return;
        }

        // Directly open the config modal without locking parameters
        setIsConfigModalOpen(true);
    };

    const handleCloseConfigModal = () => {
        setIsConfigModalOpen(false);
    };

    const [insertPosition, setInsertPosition] = useState<number>(-1);
    const [activeBranchStep, setActiveBranchStep] = useState<{ stepId: string; branch: 'true' | 'false' } | null>(null);

    const handleFunctionSelect = (functionType: FunctionType, subfunctionId?: number, responseType?: 'success' | 'error') => {
        const newStep: ConfigurationStep = {
            id: Date.now().toString(),
            type: functionType,
            subfunctionId: subfunctionId,
            // Initialize conditional steps with default config including conditions
            ...(functionType === 'conditional' && {
                config: {
                    conditions: [{
                        id: '1',
                        sequence: 1,
                        andOr: null,
                        lhs: { type: '', value: '', dataType: 'String' },
                        operator: 'equals',
                        rhs: { type: '', value: '', dataType: 'String' }
                    }],
                    next: {
                        true: [],
                        false: []
                    }
                }
            }),
            // Initialize output steps with responseType config
            ...(functionType === 'output' && {
                config: {
                    responseType: responseType || 'success',
                    type: '',
                    dataType: '',
                    value: '',
                    staticValue: '',
                    errorMessage: '',
                    errorCode: ''
                }
            })
        };

        // Check if we're adding to a conditional branch
        if (activeBranchStep) {
            // Helper function to recursively find and update a conditional step
            const updateConditionalStep = (steps: ConfigurationStep[]): ConfigurationStep[] => {
                return steps.map(step => {
                    if (step.id === activeBranchStep.stepId && step.type === 'conditional') {
                        const branch = activeBranchStep.branch;
                        const currentBranchSteps = step.config?.next?.[branch] || [];

                        return {
                            ...step,
                            config: {
                                ...step.config,
                                activeBranch: branch,
                                branchExpanded: true,
                                next: {
                                    true: branch === 'true' ? [...currentBranchSteps, newStep] : (step.config?.next?.true || []),
                                    false: branch === 'false' ? [...currentBranchSteps, newStep] : (step.config?.next?.false || [])
                                }
                            }
                        };
                    } else if (step.type === 'conditional' && step.config?.next) {
                        // Recursively search in this conditional's branches
                        const updatedTrueSteps = updateConditionalStep(step.config.next.true || []);
                        const updatedFalseSteps = updateConditionalStep(step.config.next.false || []);

                        // Only update if something changed
                        if (updatedTrueSteps !== step.config.next.true || updatedFalseSteps !== step.config.next.false) {
                            return {
                                ...step,
                                config: {
                                    ...step.config,
                                    next: {
                                        true: updatedTrueSteps,
                                        false: updatedFalseSteps
                                    }
                                }
                            };
                        }
                    }
                    return step;
                });
            };

            const updatedSteps = updateConditionalStep(configurationSteps);
            updateConfigurationSteps(updatedSteps);
            setActiveBranchStep(null);
        } else {
            // Insert at the specified position or at the end
            if (insertPosition >= 0 && insertPosition <= configurationSteps.length) {
                const newSteps = [...configurationSteps];
                newSteps.splice(insertPosition + 1, 0, newStep);
                updateConfigurationSteps(newSteps);
            } else {
                updateConfigurationSteps([...configurationSteps, newStep]);
            }
            setInsertPosition(-1);
        }

        // Mark configuration as started only when a function is selected
        setConfigurationStarted(true);
        setHasUnsavedChanges(true); // Mark as changed when adding a step
        setIsConfigModalOpen(false);

        // Scroll to show the newly added card
        setTimeout(() => {
            const newCardElement = document.getElementById(`step-${newStep.id}`);
            if (newCardElement) {
                newCardElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        }, 150);
    };

    const handleAddStep = (position: number) => {
        // Get all current step IDs (including nested steps in conditionals)
        const getAllStepIds = (steps: ConfigurationStep[]): string[] => {
            const ids: string[] = [];
            steps.forEach(step => {
                ids.push(step.id);
                if (step.type === 'conditional' && step.config?.next) {
                    ids.push(...getAllStepIds(step.config.next.true || []));
                    ids.push(...getAllStepIds(step.config.next.false || []));
                }
            });
            return ids;
        };

        const currentStepIds = getAllStepIds(configurationSteps);

        // Only check validation errors for steps that currently exist
        const hasValidationErrors = currentStepIds.some(stepId => stepValidationErrors[stepId] === true);

        if (hasValidationErrors) {
            // Show validation errors and prevent modal from opening
            setShowStepValidation(true);
            return;
        }

        setInsertPosition(position);
        setShowStepValidation(false);
        setIsConfigModalOpen(true);
    };

    const handleValidationStatusChange = useCallback((stepId: string, hasErrors: boolean) => {
        setStepValidationErrors(prev => ({
            ...prev,
            [stepId]: hasErrors
        }));
    }, []);

    const handleAddBranchStep = (stepId: string, branch: 'true' | 'false') => {
        setActiveBranchStep({ stepId, branch });
        setIsConfigModalOpen(true);
    };

    const handleConfigUpdate = (stepId: string, config: any) => {
        updateConfigurationSteps(configurationSteps.map(step =>
            step.id === stepId ? { ...step, config } : step
        ));
        setHasUnsavedChanges(true); // Mark as changed
    };

    // Helper function to determine if a step is a leaf node (has no children)
    const isLeafNode = (step: ConfigurationStep): boolean => {
        // Output cards are always leaf nodes (they can never have children)
        if (step.type === 'output') {
            return true;
        }

        // Subfunction cards are leaf nodes (they don't have children in this architecture)
        if (step.type === 'subfunction') {
            return true;
        }

        // Conditional cards are leaf nodes only if BOTH branches are empty
        if (step.type === 'conditional' && step.config?.next) {
            const trueIsEmpty = !step.config.next.true || step.config.next.true.length === 0;
            const falseIsEmpty = !step.config.next.false || step.config.next.false.length === 0;
            return trueIsEmpty && falseIsEmpty;
        }

        return false;
    };

    const handleDeleteBranchStep = (parentStepId: string, stepIdToDelete: string, branch: 'true' | 'false') => {
        // Recursively find and update the parent conditional step to remove the specified step from its branch
        const deleteFromSteps = (steps: ConfigurationStep[]): ConfigurationStep[] => {
            return steps.map(step => {
                if (step.id === parentStepId && step.type === 'conditional' && step.config?.next) {
                    // Found the parent conditional - remove the step from the specified branch
                    const updatedBranch = step.config.next[branch]?.filter((s: ConfigurationStep) => s.id !== stepIdToDelete) || [];
                    return {
                        ...step,
                        config: {
                            ...step.config,
                            next: {
                                ...step.config.next,
                                [branch]: updatedBranch
                            }
                        }
                    };
                } else if (step.type === 'conditional' && step.config?.next) {
                    // Recursively search in nested conditionals
                    return {
                        ...step,
                        config: {
                            ...step.config,
                            next: {
                                true: deleteFromSteps(step.config.next.true || []),
                                false: deleteFromSteps(step.config.next.false || [])
                            }
                        }
                    };
                }
                return step;
            });
        };

        updateConfigurationSteps(deleteFromSteps(configurationSteps));
        setHasUnsavedChanges(true); // Mark as changed
    };

    const handleDeleteMainFlowStep = (stepIdToDelete: string) => {
        // Remove step from main flow
        const updatedSteps = configurationSteps.filter(step => step.id !== stepIdToDelete);
        updateConfigurationSteps(updatedSteps);
        setHasUnsavedChanges(true);

        // Clean up validation errors for the deleted step so Add button works
        setStepValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[stepIdToDelete];
            return newErrors;
        });

        // Reset states if all steps are deleted
        if (updatedSteps.length === 0) {
            setConfigurationStarted(false);
            setStepValidationErrors({});
            setShowStepValidation(false);
        }
    };

    // Zoom control functions
    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 10, 150)); // Max 150%
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 10, 25)); // Min 25%
    };

    // Shared helper function to recursively process all steps including nested conditionals
    const processStepsRecursively = (steps: ConfigurationStep[], parentNext: string | null = null, stepCounter = { count: 0 }): any[] => {
        const allSteps: any[] = [];

        steps.forEach((step, index) => {
            const stepId = step.id;
            const nextStep = index < steps.length - 1 ? steps[index + 1].id : parentNext;
            stepCounter.count++;

            if (step.type === 'subfunction') {
                const subfunc = subfunctions.find(f => f.id === step.subfunctionId);
                const config = step.config || {};
                const inputParams = (config.params || []).map((paramConfig: any, paramIdx: number) => {
                    let dataValue = '';
                    let dataType = '';

                    if (paramConfig.type === 'Static Value') {
                        dataType = 'static';
                        dataValue = paramConfig.value || '';
                    } else if (paramConfig.type?.startsWith('Input Parameter')) {
                        dataType = 'inputParam';
                        const matchedParam = inputParameters.find(p => p.name === paramConfig.type);
                        dataValue = matchedParam?.fieldName || '';
                    } else {
                        dataType = 'stepOutputVariable';
                        dataValue = paramConfig.type || '';
                    }

                    // Get the actual parameter name from the subfunction definition
                    const subfuncParam = subfunc?.inputParams?.[paramIdx];
                    const paramName = subfuncParam?.name || String(paramIdx + 1);

                    return {
                        subFuncParamId: paramName,
                        data: {
                            type: dataType,
                            value: dataValue
                        }
                    };
                });

                allSteps.push({
                    id: stepId,
                    type: "subFunction",
                    outputVariableName: config.outputVariable || `step_${stepCounter.count}_output_variable`,
                    returnType: subfunc?.returnType?.toLowerCase() || "string",
                    subFunction: {
                        id: subfunc?.functionName || String(step.subfunctionId),
                        inputParams
                    },
                    next: nextStep
                });
            } else if (step.type === 'conditional') {
                const config = step.config || {};
                const conditions = (config.conditions || []).map((cond: any) => {
                    const processConditionData = (data: any) => {
                        if (!data) return { type: 'static', value: '', dataType: 'String' };

                        if (data.type === 'static' || data.type === 'Static Value') {
                            return {
                                type: 'static',
                                value: data.value || '',
                                dataType: data.dataType || 'String'
                            };
                        } else if (data.type?.startsWith('Input Parameter')) {
                            const matchedParam = inputParameters.find(p => p.name === data.type);
                            return {
                                type: 'inputParam',
                                value: matchedParam?.fieldName || '',
                                dataType: data.dataType || 'String'
                            };
                        } else {
                            return {
                                type: 'stepOutputVariable',
                                value: data.type || data.value || '',
                                dataType: data.dataType || 'String'
                            };
                        }
                    };

                    return {
                        id: cond.id,
                        sequence: cond.sequence,
                        andOr: cond.andOr,
                        lhs: processConditionData(cond.lhs),
                        operator: cond.operator,
                        rhs: processConditionData(cond.rhs)
                    };
                });

                let trueNext: string | null = null;
                let falseNext: string | null = null;

                if (config.next) {
                    if (config.next.true && Array.isArray(config.next.true) && config.next.true.length > 0) {
                        trueNext = config.next.true[0].id;
                        const trueSteps = processStepsRecursively(config.next.true, nextStep, stepCounter);
                        allSteps.push(...trueSteps);
                    } else {
                        trueNext = nextStep;
                    }

                    if (config.next.false && Array.isArray(config.next.false) && config.next.false.length > 0) {
                        falseNext = config.next.false[0].id;
                        const falseSteps = processStepsRecursively(config.next.false, nextStep, stepCounter);
                        allSteps.push(...falseSteps);
                    } else {
                        falseNext = nextStep;
                    }
                }

                allSteps.push({
                    id: stepId,
                    type: "condition",
                    outputVariableName: null,
                    returnType: "boolean",
                    conditions: conditions,
                    next: {
                        true: trueNext,
                        false: falseNext
                    }
                });
            } else if (step.type === 'output') {
                const outputConfig = step.config || {};
                let outputValue = '';
                let outputType = outputConfig.type || '';

                if (outputConfig.type === 'stepOutputVariable') {
                    outputValue = outputConfig.value || '';
                } else if (outputConfig.type === 'inputParam') {
                    const matchedParam = inputParameters.find(p => p.name === outputConfig.value);
                    outputValue = matchedParam?.fieldName || '';
                } else if (outputConfig.type === 'static') {
                    outputValue = outputConfig.staticValue || '';
                }

                allSteps.push({
                    id: stepId,
                    type: "output",
                    outputVariableName: null,
                    returnType: outputConfig.dataType?.toLowerCase() || "any",
                    data: {
                        responseType: outputConfig.responseType || 'success',
                        type: outputType,
                        dataType: outputConfig.dataType?.toLowerCase() || "",
                        value: outputValue,
                        errorCode: outputConfig.errorCode || '',
                        errorMessage: outputConfig.errorMessage || ''
                    },
                    next: null
                });
            }
        });

        return allSteps;
    };

    const handleSave = async () => {
        // Validation: Verify if an Output Card exists (recursively check in conditionals)
        const hasOutputStepRecursive = (steps: ConfigurationStep[]): boolean => {
            return steps.some(step => {
                if (step.type === 'output') return true;
                if (step.type === 'conditional' && step.config?.next) {
                    return hasOutputStepRecursive(step.config.next.true || []) ||
                        hasOutputStepRecursive(step.config.next.false || []);
                }
                return false;
            });
        };

        const hasOutputStep = hasOutputStepRecursive(configurationSteps);

        if (!hasOutputStep) {
            Modal.error({
                title: 'Missing Output Card',
                content: 'Please add an Output Card before saving the configuration.',
                okText: 'OK',
                centered: true
            });
            return;
        }
        // Generate the ruleFunction JSON structure
        const ruleFunction = {
            id: Date.now(),
            code: "",
            returnType: "string",
            ruleId: rule?.id || "",
            inputParams: inputParameters.map((param, index) => ({
                id: parseInt(param.id),
                sequence: index + 1,
                name: param.fieldName,
                dataType: param.dataType?.toLowerCase() || "string",
                paramType: "inputField",
                mandatory: "true",
                default: "",
                description: ""
            })),
            steps: processStepsRecursively(configurationSteps)
        };

        // Generate JavaScript code from the rule function
        // Always regenerate to ensure latest compiler changes are applied
        console.log("🔄 Regenerating JavaScript code...");
        try {
            const compiledCode = compileRule(ruleFunction as any);
            ruleFunction.code = compiledCode;
            setGeneratedJsCode(compiledCode);
            console.log("✅ JavaScript code generated successfully");
        } catch (error) {
            console.error('Failed to compile rule during save:', error);
            Modal.error({
                title: 'Code Generation Failed',
                content: 'Failed to generate JavaScript code. Please check your rule configuration.',
                okText: 'OK',
                centered: true
            });
            return; // Stop save process if compilation fails
        }

        // Create the configuration object to save
        const configToSave = {
            ruleId: rule?.id,
            ruleName: rule?.name,
            savedAt: new Date().toISOString(),
            inputParameters,
            configurationSteps,
            ruleFunction
        };

        try {
            // Save to localStorage as backup
            saveRuleConfiguration(configToSave);

            // Log the generated JSON with clear formatting
            console.log("=".repeat(80));
            console.log("🔄 Saving Configuration to API...");
            console.log("=".repeat(80));
            console.log("Rule ID:", rule?.id);
            console.log("Rule Name:", rule?.name);
            console.log("=".repeat(80));
            console.log("Generated Rule Function JSON:");
            console.log(JSON.stringify(ruleFunction, null, 2));
            console.log("=".repeat(80));

            // Check if rule function already exists for this rule
            let savedRuleFunction;
            try {
                const existingRuleFunction = await ruleFunctionsApi.getByRuleId(rule.id);
                console.log("📝 Updating existing rule function...");
                // Update existing rule function
                savedRuleFunction = await ruleFunctionsApi.update(existingRuleFunction.id, {
                    code: ruleFunction.code,
                    return_type: ruleFunction.returnType,
                    input_params: ruleFunction.inputParams.map((param: any) => ({
                        sequence: param.sequence,
                        name: param.name,
                        data_type: param.dataType,
                        param_type: param.paramType as 'inputField' | 'metaDataField' | 'default',
                        mandatory: param.mandatory === "true" || param.mandatory === true,
                        default_value: param.default || null,
                        description: param.description || ''
                    }))
                });
                console.log("✅ Rule function updated successfully!");

                // Delete existing steps before creating new ones
                console.log("🗑️ Deleting old steps...");
                const existingSteps = await ruleFunctionStepsApi.getByRuleFunctionId(existingRuleFunction.id, { limit: 1000 });
                if (existingSteps.data.length > 0) {
                    await Promise.all(
                        existingSteps.data.map(step =>
                            ruleFunctionStepsApi.delete(step.id, existingRuleFunction.id)
                        )
                    );
                    console.log(`✅ Deleted ${existingSteps.data.length} old steps`);
                }
            } catch (error: any) {
                if (error.message.includes('not found') || error.message.includes('404')) {
                    console.log("✨ Creating new rule function...");
                    // Create new rule function
                    savedRuleFunction = await ruleFunctionsApi.create({
                        rule_id: rule.id,
                        code: ruleFunction.code,
                        return_type: ruleFunction.returnType,
                        input_params: ruleFunction.inputParams.map((param: any) => ({
                            sequence: param.sequence,
                            name: param.name,
                            data_type: param.dataType,
                            param_type: param.paramType as 'inputField' | 'metaDataField' | 'default',
                            mandatory: param.mandatory === "true" || param.mandatory === true,
                            default_value: param.default || null,
                            description: param.description || ''
                        }))
                    });
                    console.log("✅ Rule function created successfully!");
                } else {
                    throw error;
                }
            }

            // Save all steps
            console.log("💾 Saving steps...");
            const stepsToCreate: CreateRuleFunctionStepDto[] = ruleFunction.steps.map((step: any, index: number) => {
                // Determine subfunction_id: if it's already a number, use it; if it's a string, find the matching subfunction
                let subfunctionId = null;
                if (step.subFunction?.id) {
                    if (typeof step.subFunction.id === 'number') {
                        subfunctionId = step.subFunction.id;
                    } else {
                        // Find the subfunction by function_name (string ID)
                        const matchingSubfunction = subfunctions.find(sf => sf.functionName === step.subFunction.id);
                        subfunctionId = matchingSubfunction?.id || null;
                    }
                }

                return {
                    id: step.id,
                    rule_function_id: savedRuleFunction.id,
                    type: step.type as 'subFunction' | 'condition' | 'output',
                    output_variable_name: step.outputVariableName || null,
                    return_type: step.returnType || null,
                    next_step: step.next || null,
                    sequence: index + 1,
                    subfunction_id: subfunctionId,
                    subfunction_params: step.subFunction?.inputParams?.map((param: any) => ({
                        subfunction_param_name: param.subFuncParamId || '',
                        data_type: param.data.type as 'static' | 'inputParam' | 'stepOutputVariable',
                        data_value: param.data.value || ''
                    })) || [],
                    conditions: step.conditions?.map((cond: any) => ({
                        sequence: cond.sequence,
                        and_or: cond.andOr || null,
                        lhs_type: cond.lhs.type as 'static' | 'inputParam' | 'stepOutputVariable',
                        lhs_data_type: cond.lhs.dataType,
                        lhs_value: cond.lhs.value,
                        operator: cond.operator,
                        rhs_type: cond.rhs.type as 'static' | 'inputParam' | 'stepOutputVariable',
                        rhs_data_type: cond.rhs.dataType,
                        rhs_value: cond.rhs.value
                    })) || [],
                    output_data: step.data ? {
                        data_type: step.data.type as 'static' | 'inputParam' | 'stepOutputVariable',
                        data_value_type: step.data.dataType,
                        data_value: step.data.value || ''
                    } : undefined
                };
            });

            await ruleFunctionStepsApi.bulkCreate(stepsToCreate);

            // Reset unsaved changes flag after successful save
            setHasUnsavedChanges(false);

            // Show success confirmation modal
            Modal.confirm({
                title: 'Rule Saved Successfully',
                content: 'Your rule configuration has been saved to the database.',
                okText: 'OK',
                centered: true,
                icon: null,
                cancelButtonProps: { style: { display: 'none' } }
            });
        } catch (error: any) {
            console.error('Failed to save configuration:', error);
            Modal.error({
                title: 'Save Failed',
                content: error.message || 'Failed to save configuration. Please try again.',
                okText: 'OK',
                centered: true
            });
        }
    };

    const handleGenerateJavaScript = () => {
        // Generate the rule JSON from current state
        if (rule && configurationSteps.length > 0) {
            const ruleFunction = {
                id: Date.now(),
                code: "",
                returnType: "string",
                ruleId: rule.id,
                inputParams: inputParameters.map((param, index) => ({
                    id: parseInt(param.id),
                    sequence: index + 1,
                    name: param.fieldName,
                    dataType: param.dataType?.toLowerCase() || "string",
                    paramType: "inputField",
                    mandatory: "true",
                    default: "",
                    description: ""
                })),
                steps: processStepsRecursively(configurationSteps)
            };

            // Compile the rule to JavaScript
            try {
                const compiledCode = compileRule(ruleFunction as any);
                setGeneratedJsCode(compiledCode);
                setRightPanelContent('js');
                setRightPanelOpen(true);
            } catch (error) {
                console.error('Failed to compile rule:', error);
                Modal.error({
                    title: 'Compilation Failed',
                    content: 'Failed to generate JavaScript code. Please check your rule configuration.',
                    okText: 'OK',
                    centered: true
                });
            }
        } else {
            Modal.warning({
                title: 'No Configuration',
                content: 'No configuration steps found. Please add some steps first.',
                okText: 'OK',
                centered: true
            });
        }
    };

    const handleCopyJavaScript = () => {
        navigator.clipboard.writeText(generatedJsCode).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(() => {
            console.error('Failed to copy to clipboard');
        });
    };

    const handleTestRule = () => {
        if (rule && configurationSteps.length > 0) {
            // Check if we already have generated code and no unsaved changes
            if (generatedJsCode && !hasUnsavedChanges) {
                console.log("✅ Using existing generated code for testing");

                // Initialize test inputs with empty values
                const initialInputs: Record<string, any> = {};
                inputParameters.forEach(param => {
                    initialInputs[param.fieldName] = '';
                });
                setTestInputs(initialInputs);
                setTestResult(null);
                setRightPanelContent('test');
                setRightPanelOpen(true);
                return;
            }

            // Generate JavaScript code if not available or changes were made
            console.log("🔄 Generating new JavaScript code for testing");
            const ruleFunction = {
                id: Date.now(),
                code: "",
                returnType: "string",
                ruleId: rule.id,
                inputParams: inputParameters.map((param, index) => ({
                    id: parseInt(param.id),
                    sequence: index + 1,
                    name: param.fieldName,
                    dataType: param.dataType?.toLowerCase() || "string",
                    paramType: "inputField",
                    mandatory: "true",
                    default: "",
                    description: ""
                })),
                steps: processStepsRecursively(configurationSteps)
            };

            // Compile the rule to JavaScript
            try {
                const compiledCode = compileRule(ruleFunction as any);
                setGeneratedJsCode(compiledCode);

                // Initialize test inputs with empty values
                const initialInputs: Record<string, any> = {};
                inputParameters.forEach(param => {
                    initialInputs[param.fieldName] = '';
                });
                setTestInputs(initialInputs);
                setTestResult(null);
                setRightPanelContent('test');
                setRightPanelOpen(true);
            } catch (error) {
                console.error('Failed to compile rule:', error);
                Modal.error({
                    title: 'Compilation Failed',
                    content: 'Failed to generate JavaScript code. Please check your rule configuration before testing.',
                    okText: 'OK',
                    centered: true
                });
            }
        } else {
            Modal.warning({
                title: 'No Configuration',
                content: 'No configuration steps found. Please add some steps first before testing.',
                okText: 'OK',
                centered: true
            });
        }
    };

    const handleTestInputChange = (paramName: string, value: any) => {
        setTestInputs(prev => ({
            ...prev,
            [paramName]: value
        }));
    };

    const handleExecuteTest = async () => {
        if (!generatedJsCode) {
            Modal.error({
                title: 'No Code Generated',
                content: 'Please generate JavaScript code first by clicking the "Generate JavaScript" button.',
                okText: 'OK',
                centered: true
            });
            return;
        }

        setIsTestRunning(true);
        setTestResult(null);

        try {
            // Extract the function name from the generated code
            const functionNameMatch = generatedJsCode.match(/async function (\w+)\(/);
            const functionName = functionNameMatch ? functionNameMatch[1] : null;

            if (!functionName) {
                throw new Error('Could not extract function name from generated code');
            }

            // Create a function from the generated code and return the function reference
            const functionCode = generatedJsCode + `\nreturn ${functionName};`;
            const ruleFunction = new Function(functionCode)();

            // Execute the function with test inputs
            const result = await ruleFunction(testInputs);
            setTestResult(result);
        } catch (error: any) {
            setTestResult({
                success: false,
                error: { message: error.message || 'An error occurred during execution' }
            });
        } finally {
            setIsTestRunning(false);
        }
    };

    const handleClearRule = () => {
        confirm({
            title: 'Clear Rule',
            icon: <ExclamationCircleOutlined className="text-red-600" />,
            content: 'Are you sure you want to clear all input parameters and configuration steps?',
            okText: 'Yes, Clear',
            okType: 'danger',
            cancelText: 'Cancel',
            centered: true,
            onOk() {
                // Reset all state
                setInputParameters([
                    { id: '1', name: 'Input Parameter 1', fieldName: '', type: 'Variable Data Field', dataType: 'String' }
                ]);
                updateConfigurationSteps([]);
                setConfigurationStarted(false);
                setParameterErrors({});
                setGeneratedJsCode('');
                setTestInputs({});
                setTestResult(null);
                setRightPanelOpen(false);
                setRightPanelContent(null);
            },
            onCancel() {
                // Do nothing
            },
        });
    };

    const handleCloseRightPanel = () => {
        setIsClosing(true);
        setTimeout(() => {
            setRightPanelOpen(false);
            setIsClosing(false);
            setIsCopied(false);
        }, 300); // Match animation duration
    };

    const handleEditRule = () => {
        setIsViewMode(false);
    };

    if (!rule) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-lg text-gray-500">Loading...</div>
                </div>
            </Layout>
        );
    }

    // Predefined functions for the sidebar (empty - will be populated in future)
    const userDefinedRules: string[] = [];

    const stringFunctions = subfunctions.filter(func => func.categoryId === 'STR' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const numberFunctions = subfunctions.filter(func => func.categoryId === 'NUM' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const dateFunctions = subfunctions.filter(func => func.categoryId === 'DATE' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const utilFunctions = subfunctions.filter(func => func.categoryId === 'UTIL' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const conditionalFunctions = [
        { name: 'IF', type: 'conditional' as FunctionType },
    ].filter(func => func.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <Layout>
            <div className="h-screen w-full bg-gray-50 overflow-hidden flex flex-col">
                {/* Fixed Header Section - Rule Title and Action Buttons */}
                <div className="flex-shrink-0 z-20 bg-gray-50 px-8 py-6">
                    <div className="max-w-full overflow-hidden flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                            <Tooltip title={rule.name}>
                                <h1 className="text-xl font-bold text-gray-900 truncate cursor-pointer">{rule.name}</h1>
                            </Tooltip>
                            <Tooltip title={rule.description}>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2 cursor-pointer">{rule.description}</p>
                            </Tooltip>
                        </div>

                        {/* Action Buttons - Top Right - Hidden in empty state */}
                        {showConfiguration && (!isViewMode || configurationSteps.length > 0) && (
                            <div className="flex gap-3 ml-6 flex-shrink-0">
                                {isViewMode ? (
                                    <>
                                        <Button
                                            size="large"
                                            type="primary"
                                            onClick={handleEditRule}
                                            className="bg-red-500 hover:bg-red-400 focus:bg-red-400 border-none"
                                        >
                                            Edit Rule
                                        </Button>
                                        <Button
                                            size="large"
                                            onClick={handleGenerateJavaScript}
                                            className="hover:border-red-400 hover:text-red-500 focus:border-red-400 focus:text-red-500"
                                        >
                                            Show JS Code
                                        </Button>
                                        <Button
                                            size="large"
                                            onClick={handleTestRule}
                                            className="hover:border-red-400 hover:text-red-500 focus:border-red-400 focus:text-red-500"
                                        >
                                            Test Rule
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            size="large"
                                            onClick={handleClearRule}
                                            className="hover:border-red-400 hover:text-red-500 focus:border-red-400 focus:text-red-500"
                                        >
                                            Clear Rule
                                        </Button>
                                        <Button
                                            size="large"
                                            onClick={handleGenerateJavaScript}
                                            className="hover:border-red-400 hover:text-red-500 focus:border-red-400 focus:text-red-500"
                                        >
                                            Show JS Code
                                        </Button>
                                        <Button
                                            size="large"
                                            onClick={handleTestRule}
                                            className="hover:border-red-400 hover:text-red-500 focus:border-red-400 focus:text-red-500"
                                        >
                                            Test Rule
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 w-full bg-gray-50 overflow-auto">
                    {/* Empty State - Show when configuration is hidden OR in view mode with no steps */}
                    {(!showConfiguration || (isViewMode && configurationSteps.length === 0)) && (
                        <div className="flex flex-col items-center justify-center py-20 px-8">
                            <p className="text-lg text-gray-900 mb-6">Click configure to start building your rule</p>
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => {
                                    setShowConfiguration(true);
                                    // If in view mode and no configuration steps exist, switch to edit mode
                                    if (isViewMode && configurationSteps.length === 0) {
                                        setIsViewMode(false);
                                    }
                                }}
                                className="bg-red-500 hover:bg-red-400 focus:bg-red-400 border-none rounded-lg px-8"
                            >
                                Configure
                            </Button>
                        </div>
                    )}

                    {/* Scrollable Container for entire rule tree */}
                    {showConfiguration && (!isViewMode || configurationSteps.length > 0) && (
                        <div className="w-full min-h-screen bg-gray-50">
                            {/* Zoom Controls - Fixed position when configuration started */}
                            {configurationSteps.length > 0 && (
                                <div className="fixed top-20 right-8 z-40 bg-white/60 shadow-lg rounded-lg p-2 flex flex-col gap-2">
                                    <Tooltip title="Zoom In" placement="left">
                                        <Button
                                            icon={<ZoomInOutlined />}
                                            onClick={handleZoomIn}
                                            disabled={zoomLevel >= 150}
                                            className="flex items-center justify-center border-none bg-transparent hover:bg-gray-100"
                                            size="middle"
                                        />
                                    </Tooltip>
                                    <div className="text-center text-xs font-semibold text-gray-600 py-1">
                                        {zoomLevel}%
                                    </div>
                                    <Tooltip title="Zoom Out" placement="left">
                                        <Button
                                            icon={<ZoomOutOutlined />}
                                            onClick={handleZoomOut}
                                            disabled={zoomLevel <= 25}
                                            className="flex items-center justify-center border-none bg-transparent hover:bg-gray-100"
                                            size="middle"
                                        />
                                    </Tooltip>
                                </div>
                            )}

                            <div ref={scrollContainerRef} className="bg-gray-50 px-8 pb-8">
                                <div
                                    className="min-w-fit flex flex-col items-center transition-transform duration-200 origin-top bg-gray-50"
                                    style={{ transform: `scale(${zoomLevel / 100})` }}
                                >
                                    {/* Define Input Parameters */}
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 pb-8 mb-6 w-full" style={{ maxWidth: '1100px' }}>
                                        <div className="flex items-start justify-between mb-1">
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                                                    {isViewMode ? 'Input Parameters' : 'Define Input Parameters'}
                                                </h2>
                                                <p className="text-sm text-gray-600">
                                                    {(() => {
                                                        const completedParams = inputParameters.filter(param =>
                                                            param.type &&
                                                            param.fieldName.trim() &&
                                                            param.dataType
                                                        );
                                                        return `${completedParams.length} parameter${completedParams.length !== 1 ? 's' : ''} defined`;
                                                    })()}
                                                </p>
                                            </div>
                                            {!isViewMode && (
                                                <Button
                                                    icon={<PlusOutlined />}
                                                    size="middle"
                                                    onClick={addInputParameter}
                                                    className="hover:border-red-400 hover:text-red-500 focus:border-red-400 focus:text-red-500 rounded-lg px-6"
                                                >
                                                    Add Parameter
                                                </Button>
                                            )}
                                        </div>

                                        {isViewMode ? (
                                            /* View Mode with disabled selects and inputs */
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto mt-6 px-1 pb-1">
                                                {inputParameters.map((param, index) => (
                                                    <div key={param.id}>
                                                        <div className="grid grid-cols-[1fr_1fr_1fr] gap-6 items-start">
                                                            {/* Type Column */}
                                                            <div>
                                                                <Label className="text-sm font-medium text-gray-700 mb-2 block">Type</Label>
                                                                <Select
                                                                    value={param.type || undefined}
                                                                    className="w-full"
                                                                    size="large"
                                                                    options={[
                                                                        { label: 'Variable Data Field', value: 'VD Field' },
                                                                        { label: 'Fixed Field', value: 'Fixed Field' }
                                                                    ]}
                                                                    disabled
                                                                />
                                                            </div>

                                                            {/* Field Name Column */}
                                                            <div>
                                                                <Label className="text-sm font-medium text-gray-700 mb-2 block">Field Name</Label>
                                                                <Input
                                                                    value={param.fieldName}
                                                                    className="w-full"
                                                                    inputSize="lg"
                                                                    disabled
                                                                />
                                                            </div>

                                                            {/* Field Data Type Column */}
                                                            <div>
                                                                <Label className="text-sm font-medium text-gray-700 mb-2 block">Data Type</Label>
                                                                <Select
                                                                    value={param.dataType || 'String'}
                                                                    className="w-full"
                                                                    size="large"
                                                                    options={[
                                                                        { label: 'String', value: 'String' },
                                                                        { label: 'Integer', value: 'Integer' },
                                                                        { label: 'Float', value: 'Float' },
                                                                        { label: 'Boolean', value: 'Boolean' }
                                                                    ]}
                                                                    disabled
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Horizontal Line Separator */}
                                                        {index < inputParameters.length - 1 && (
                                                            <div className="border-b border-gray-200 my-4"></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Editable Form View for Edit Mode */
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto mt-6 px-1 pb-1">
                                                {inputParameters.map((param, index) => (
                                                    <div key={param.id}>
                                                        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-6 items-start">
                                                            {/* Type Column */}
                                                            <div>
                                                                <Label className="text-sm font-medium text-gray-700 mb-2 block">Type <span className="text-black">*</span></Label>
                                                                <Select
                                                                    showSearch
                                                                    value={param.type || undefined}
                                                                    onChange={(value) => updateInputParameter(param.id, 'type', value)}
                                                                    placeholder="Select type"
                                                                    className="w-full"
                                                                    size="large"
                                                                    status={parameterErrors[param.id]?.type ? 'error' : undefined}
                                                                    options={[
                                                                        { label: 'Variable Data Field', value: 'VD Field' },
                                                                        { label: 'Fixed Field', value: 'Fixed Field' }
                                                                    ]}
                                                                    filterOption={(input, option) =>
                                                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                                    }
                                                                    popupMatchSelectWidth={false}
                                                                    listHeight={256}
                                                                />
                                                                {parameterErrors[param.id]?.type && (
                                                                    <span className="text-red-500 text-xs mt-1 block">This field is required</span>
                                                                )}
                                                            </div>

                                                            {/* Field Name Column */}
                                                            <div>
                                                                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                                                    {param.type === 'VD Field'
                                                                        ? 'Variable Data Field Name'
                                                                        : param.type === 'Fixed Field'
                                                                            ? 'Fixed Field Name'
                                                                            : 'Variable Data Field Name'}  <span className="text-black">*</span>
                                                                </Label>
                                                                <Input
                                                                    value={param.fieldName}
                                                                    onChange={(e) => updateInputParameter(param.id, 'fieldName', e.target.value)}
                                                                    placeholder={
                                                                        param.type === 'VD Field'
                                                                            ? 'Enter Variable Data Field name'
                                                                            : param.type === 'Fixed Field'
                                                                                ? 'Enter fixed field name'
                                                                                : 'Enter Variable Data Field name'
                                                                    }
                                                                    className="w-full"
                                                                    inputSize="lg"
                                                                    variant={(parameterErrors[param.id]?.fieldName || parameterErrors[param.id]?.duplicate) ? 'error' : 'default'}
                                                                />
                                                                {parameterErrors[param.id]?.fieldName && (
                                                                    <span className="text-red-500 text-xs mt-1 block">This field is required</span>
                                                                )}
                                                                {parameterErrors[param.id]?.duplicate && !parameterErrors[param.id]?.fieldName && (
                                                                    <span className="text-red-500 text-xs mt-1 block">Field name must be unique</span>
                                                                )}
                                                            </div>

                                                            {/* Field Data Type Column */}
                                                            <div>
                                                                <Label className="text-sm font-medium text-gray-700 mb-2 block">Field Data Type <span className="text-black">*</span></Label>
                                                                <Select
                                                                    showSearch
                                                                    value={param.dataType || 'String'}
                                                                    onChange={(value) => handleDataTypeChange(param.id, param.dataType || 'String', value)}
                                                                    placeholder="Select data type"
                                                                    className="w-full"
                                                                    size="large"
                                                                    status={parameterErrors[param.id]?.dataType ? 'error' : undefined}
                                                                    options={[
                                                                        { label: 'String', value: 'String' },
                                                                        { label: 'Integer', value: 'Integer' },
                                                                        { label: 'Float', value: 'Float' },
                                                                        { label: 'Boolean', value: 'Boolean' }
                                                                    ]}
                                                                    filterOption={(input, option) =>
                                                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                                    }
                                                                    popupMatchSelectWidth={false}
                                                                    listHeight={256}
                                                                />
                                                                {parameterErrors[param.id]?.dataType && (
                                                                    <span className="text-red-500 text-xs mt-1 block">This field is required</span>
                                                                )}
                                                            </div>

                                                            {/* Delete Button Column */}
                                                            <div className="flex items-start justify-end pt-8">
                                                                {inputParameters.length > 1 && (
                                                                    <Button
                                                                        icon={<CloseOutlined />}
                                                                        onClick={() => removeInputParameter(param.id)}
                                                                        className="delete-param-btn flex items-center justify-center w-9 h-9 border-none text-gray-400 transition-colors rounded-full"
                                                                        type="text"
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Horizontal Line Separator */}
                                                        {index < inputParameters.length - 1 && (
                                                            <div className="border-b border-gray-200 my-4"></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Start Configuration */}
                                    {!isViewMode && (
                                        <div className="flex flex-col items-center py-5 bg-gray-50">
                                            <p className="text-base font-semibold text-gray-900 mb-4">Start Configuration</p>
                                            <Button
                                                size="large"
                                                onClick={handleStartConfiguration}
                                                disabled={configurationStarted || configurationSteps.length > 0}
                                                className="border-red-400 text-red-500 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 hover:shadow-lg focus:border-red-400 focus:text-red-500 rounded-lg px-8 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 transition-all"
                                            >
                                                Start
                                            </Button>
                                        </div>
                                    )}

                                    {/* Configuration Steps */}
                                    {configurationSteps.length > 0 && (
                                        <>
                                            {/* Vertical Line connecting Start to first Card */}
                                            {!isViewMode && <div className="h-8 w-px bg-gray-300 mx-auto -mt-8"></div>}

                                            {configurationSteps.map((step, index) => {
                                                // Check if this is the last step and it's a leaf node
                                                const isLastStep = index === configurationSteps.length - 1;
                                                const canDelete = isLastStep && isLeafNode(step);

                                                return (
                                                    <div key={step.id} id={`step-${step.id}`} className="w-full flex justify-center bg-gray-50" style={step.type === 'conditional' ? { minWidth: '1600px' } : {}}>
                                                        <div className="w-full relative bg-gray-50" style={step.type !== 'conditional' ? { maxWidth: '800px' } : {}}>
                                                            {/* Delete button for leaf node in main flow */}
                                                            {!isViewMode && canDelete && step.type !== 'conditional' && (
                                                                <Button
                                                                    icon={<CloseOutlined />}
                                                                    onClick={() => handleDeleteMainFlowStep(step.id)}
                                                                    className="absolute top-3 right-3 z-20 bg-gray-100 hover:bg-red-100 hover:text-red-600 border-none shadow-sm rounded-full"
                                                                    type="text"
                                                                    size="small"
                                                                />
                                                            )}
                                                            <RuleConfigurationCard
                                                                step={step}
                                                                inputParameters={inputParameters}
                                                                stepIndex={index}
                                                                configurationSteps={configurationSteps}
                                                                onConfigUpdate={handleConfigUpdate}
                                                                onAddBranchStep={(branch) => handleAddBranchStep(step.id, branch)}
                                                                handleAddBranchStep={handleAddBranchStep}
                                                                handleDeleteBranchStep={handleDeleteBranchStep}
                                                                handleDeleteMainFlowStep={handleDeleteMainFlowStep}
                                                                canDelete={canDelete}
                                                                isViewMode={isViewMode}
                                                                allConfigurationSteps={configurationSteps}
                                                                shouldShowValidation={showStepValidation}
                                                                onValidationStatusChange={handleValidationStatusChange}
                                                            />

                                                            {/* Vertical connector line - Don't show after output card or conditional card */}
                                                            {step.type !== 'output' && step.type !== 'conditional' && (
                                                                <div className="h-10 w-px bg-gray-300 mx-auto -mt-6"></div>
                                                            )}

                                                            {/* Add Button - Only show for the last card if it's not an output card or conditional card */}
                                                            {!isViewMode && index === configurationSteps.length - 1 && step.type !== 'output' && step.type !== 'conditional' && (
                                                                <div className="flex justify-center mb-8 bg-gray-50">
                                                                    <Button
                                                                        className="border-red-400 text-red-500 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 hover:shadow-lg focus:border-red-400 focus:text-red-500 px-8 h-10 rounded-md transition-all"
                                                                        onClick={() => handleAddStep(index)}
                                                                    >
                                                                        Add
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            {/* Connector line to next card if not the last one */}
                                                            {index < configurationSteps.length - 1 && (
                                                                <div className="h-10 w-px bg-gray-300 mx-auto -mt-8"></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons Card - Fixed at bottom */}
                {!isViewMode && showConfiguration && (
                    <div className="flex-shrink-0 z-50 bg-white py-4 flex justify-center gap-3">
                        <Button
                            type="primary"
                            size="large"
                            onClick={handleSave}
                            className="bg-red-500 hover:bg-red-400 focus:bg-red-400 border-none"
                        >
                            Save
                        </Button>
                        <Button
                            size="large"
                            onClick={() => navigate('/rules')}
                            className="hover:border-red-400 hover:text-red-500 focus:border-red-400 focus:text-red-500"
                        >
                            Cancel
                        </Button>
                    </div>
                )}
            </div>

            {/* Function Library Modal */}
            <Modal
                title={null}
                open={isConfigModalOpen}
                onCancel={handleCloseConfigModal}
                footer={null}
                width={500}
                className="function-library-modal"
                styles={{ body: { maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' } }}
            >
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 pl-6">Select Function</h2>
                    <div className="relative mb-6 mx-6" style={{ width: '90%' }}>
                        <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                        <Input
                            placeholder="Search Rule"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-10 rounded-lg"
                        />
                        {searchQuery && (
                            <CloseCircleFilled
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 cursor-pointer hover:text-gray-600"
                                onClick={() => setSearchQuery('')}
                            />
                        )}
                    </div>

                    {/* Output Card Buttons - Above Panels */}
                    <div className="mb-4 px-6">
                        <span className="font-semibold text-gray-900 block mb-2">Output Card</span>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                onClick={() => handleFunctionSelect('output', undefined, 'success')}
                                className="rounded-full border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500"
                                size="small"
                            >
                                Success Card
                            </Button>
                            <Button
                                onClick={() => handleFunctionSelect('output', undefined, 'error')}
                                className="rounded-full border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500"
                                size="small"
                            >
                                Error Card
                            </Button>
                        </div>
                    </div>

                    <Collapse
                        activeKey={activeAccordionKeys}
                        onChange={(keys) => setActiveAccordionKeys(keys as string[])}
                        ghost
                        className="function-library-collapse"
                    >
                        {/* Rules */}
                        <Panel header={<span className="font-semibold text-gray-900">Rules</span>} key="1">
                            <div className="flex flex-wrap gap-2">
                                {userDefinedRules.length === 0 ? (
                                    <div className="text-sm text-gray-400 italic py-2">No data found</div>
                                ) : (
                                    userDefinedRules.map((func, index) => (
                                        <Button
                                            key={index}
                                            className="rounded-full border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500"
                                            size="small"
                                        >
                                            {func}
                                        </Button>
                                    ))
                                )}
                            </div>
                        </Panel>

                        {/* String Functions */}
                        <Panel header={<span className="font-semibold text-gray-900">String Functions</span>} key="2">
                            <div className="flex flex-wrap gap-2">
                                {stringFunctions.length === 0 ? (
                                    <div className="text-sm text-gray-400 italic py-2">No data found</div>
                                ) : (
                                    stringFunctions.map((func, index) => (
                                        <Button
                                            key={index}
                                            onClick={() => handleFunctionSelect('subfunction', func.id)}
                                            className="rounded-full border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500"
                                            size="small"
                                        >
                                            {func.name}
                                        </Button>
                                    ))
                                )}
                            </div>
                        </Panel>

                        {/* Number Functions */}
                        <Panel header={<span className="font-semibold text-gray-900">Number Functions</span>} key="number">
                            <div className="flex flex-wrap gap-2">
                                {numberFunctions.length === 0 ? (
                                    <div className="text-sm text-gray-400 italic py-2">No data found</div>
                                ) : (
                                    numberFunctions.map((func, index) => (
                                        <Button
                                            key={index}
                                            onClick={() => handleFunctionSelect('subfunction', func.id)}
                                            className="rounded-full border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500"
                                            size="small"
                                        >
                                            {func.name}
                                        </Button>
                                    ))
                                )}
                            </div>
                        </Panel>

                        {/* Date Functions */}
                        <Panel header={<span className="font-semibold text-gray-900">Date Functions</span>} key="3">
                            <div className="flex flex-wrap gap-2">
                                {dateFunctions.length === 0 ? (
                                    <div className="text-sm text-gray-400 italic py-2">No data found</div>
                                ) : (
                                    dateFunctions.map((func, index) => (
                                        <Button
                                            key={index}
                                            onClick={() => handleFunctionSelect('subfunction', func.id)}
                                            className="rounded-full border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500"
                                            size="small"
                                        >
                                            {func.name}
                                        </Button>
                                    ))
                                )}
                            </div>
                        </Panel>

                        {/* Conditional */}
                        <Panel header={<span className="font-semibold text-gray-900">Conditional</span>} key="5">
                            <div className="flex flex-wrap gap-2">
                                {conditionalFunctions.length === 0 && utilFunctions.length === 0 ? (
                                    <div className="text-sm text-gray-400 italic py-2">No data found</div>
                                ) : (
                                    <>
                                        {conditionalFunctions.map((func, index) => (
                                            <Button
                                                key={`cond-${index}`}
                                                onClick={() => func.type && handleFunctionSelect(func.type)}
                                                className="rounded-full border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500"
                                                size="small"
                                            >
                                                {func.name}
                                            </Button>
                                        ))}
                                        {utilFunctions.map((func, index) => (
                                            <Button
                                                key={`util-${index}`}
                                                onClick={() => handleFunctionSelect('subfunction', func.id)}
                                                className="rounded-full border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500"
                                                size="small"
                                            >
                                                {func.name}
                                            </Button>
                                        ))}
                                    </>
                                )}
                            </div>
                        </Panel>
                    </Collapse>
                </div>
            </Modal>

            {/* Right Panel */}
            {rightPanelOpen && (
                <div
                    className="fixed top-0 right-0 h-full bg-white shadow-2xl z-50 overflow-y-auto border-l border-gray-200"
                    style={{
                        width: '600px',
                        animation: isClosing ? 'slideOutToRight 0.3s ease-in' : 'slideInFromRight 0.3s ease-out',
                    }}
                >
                    {/* Panel Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {rightPanelContent === 'js' ? 'JavaScript Code' : 'Test Rule'}
                        </h2>
                        <Button
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={handleCloseRightPanel}
                            className="hover:bg-gray-100"
                        />
                    </div>

                    {/* Panel Content */}
                    <div className="p-6">
                        {rightPanelContent === 'js' && (
                            <div className="relative">
                                <Button
                                    onClick={handleCopyJavaScript}
                                    className="absolute top-2 right-2 z-10 bg-white hover:bg-gray-50 border border-gray-200 rounded-md p-2 flex items-center justify-center"
                                    style={{ width: '32px', height: '32px', boxShadow: 'none' }}
                                >
                                    {isCopied ? (
                                        <CheckOutlined className="text-gray-500 text-base" />
                                    ) : (
                                        <CopyOutlined className="text-gray-500 text-base" />
                                    )}
                                </Button>
                                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm pr-16" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                                    <code className="text-gray-800">
                                        {generatedJsCode || '// No code generated yet. Please configure your rule and try again.'}
                                    </code>
                                </pre>
                            </div>
                        )}

                        {rightPanelContent === 'test' && (
                            <div>
                                <h3 className="text-md font-semibold mb-4">Input Parameters</h3>
                                {inputParameters.length === 0 ? (
                                    <p className="text-gray-500 text-sm mb-4">No input parameters defined for this rule.</p>
                                ) : (
                                    inputParameters.map(param => (
                                        <div key={param.id} className="mb-4">
                                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                                {param.fieldName || param.name}
                                            </Label>
                                            <Input
                                                value={testInputs[param.fieldName] || ''}
                                                onChange={(e) => handleTestInputChange(param.fieldName, e.target.value)}
                                                placeholder={`Enter ${param.fieldName || param.name}`}
                                                inputSize="lg"
                                            />
                                        </div>
                                    ))
                                )}

                                <Button
                                    onClick={handleExecuteTest}
                                    loading={isTestRunning}
                                    className="w-full mt-4 bg-red-500 hover:bg-red-400 focus:bg-red-400 border-none"
                                    type="primary"
                                    size="large"
                                >
                                    Execute Test
                                </Button>

                                {testResult && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        {testResult.success === false && testResult.error ? (
                                            <>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Error:</h4>
                                                <p className="text-sm text-gray-800">
                                                    {testResult.error.message || 'An unknown error occurred'}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Result:</h4>
                                                <p className="text-sm text-gray-800 break-all">
                                                    {testResult?.value !== undefined
                                                        ? (typeof testResult.value === 'object'
                                                            ? (testResult.value?.value !== undefined ? String(testResult.value.value) : JSON.stringify(testResult.value))
                                                            : String(testResult.value))
                                                        : (typeof testResult === 'object' ? JSON.stringify(testResult) : String(testResult))}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Backdrop overlay when right panel is open */}
            {rightPanelOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-20 z-40"
                    onClick={handleCloseRightPanel}
                />
            )}
        </Layout>
    );
}
