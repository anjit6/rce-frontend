import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Collapse, Modal, Tooltip, Select } from 'antd';
import { PlusOutlined, CloseOutlined, SearchOutlined, ExclamationCircleOutlined, CloseCircleFilled, CheckOutlined, CopyOutlined } from '@ant-design/icons';
import Layout from '../../components/layout/Layout';
import { getRuleById, updateRule } from '../../data/rules';
import { SUBFUNCTIONS } from '../../constants/subfunctions';
import { InputParameter, FunctionType, ConfigurationStep } from '../../types/rule-configuration';
import { getRuleConfiguration, saveRuleConfiguration } from '../../data/ruleConfigurations';
import RuleConfigurationCard from '../../components/rules/RuleConfigurationCard';
import { Input } from '../../components/ui/input';
import { CustomSelect } from '../../components/ui/custom-select';
import { Label } from '../../components/ui/label';
import { compileRule } from '../../utils/ruleCompiler';

const { Panel } = Collapse;
const { confirm } = Modal;

export default function RuleCreatePage() {
    const { ruleId } = useParams<{ ruleId: string }>();
    const navigate = useNavigate();
    const [rule, setRule] = useState<any>(null);
    const [isViewMode, setIsViewMode] = useState(false); // Default to edit mode
    const [configurationStarted, setConfigurationStarted] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [configurationSteps, setConfigurationSteps] = useState<ConfigurationStep[]>([]);
    const [inputParameters, setInputParameters] = useState<InputParameter[]>([
        { id: '1', name: 'Input Parameter 1', fieldName: '', type: 'Input field', dataType: 'String' }
    ]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeAccordionKeys, setActiveAccordionKeys] = useState<string[]>([]);
    const [parameterErrors, setParameterErrors] = useState<Record<string, { type?: boolean; fieldName?: boolean; dataType?: boolean }>>({});
    const [parametersLocked, setParametersLocked] = useState(false);
    const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [currentJson, setCurrentJson] = useState<any>(null);
    const [generatedJsCode, setGeneratedJsCode] = useState<string>('');
    const [testInputs, setTestInputs] = useState<Record<string, any>>({});
    const [testResult, setTestResult] = useState<any>(null);
    const [isTestRunning, setIsTestRunning] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(false);
    const [rightPanelContent, setRightPanelContent] = useState<'js' | 'test' | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [savedRuleFunction, setSavedRuleFunction] = useState<any>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ruleId) {
            const ruleData = getRuleById(ruleId);
            if (ruleData) {
                setRule(ruleData);
                document.title = `${ruleData.name} - RCE`;

                // Load saved configuration if exists
                const savedConfig = getRuleConfiguration(parseInt(ruleId));
                if (savedConfig) {
                    console.log("📂 Loading saved configuration for rule:", ruleId);
                    console.log("Saved config:", savedConfig);

                    // Restore input parameters
                    if (savedConfig.inputParameters && savedConfig.inputParameters.length > 0) {
                        setInputParameters(savedConfig.inputParameters);
                        setParametersLocked(true);
                        console.log("✅ Input parameters restored:", savedConfig.inputParameters.length, "parameters");
                    }

                    // Restore configuration steps
                    if (savedConfig.configurationSteps && savedConfig.configurationSteps.length > 0) {
                        setConfigurationSteps(savedConfig.configurationSteps);
                        setConfigurationStarted(true);
                        console.log("✅ Configuration steps restored:", savedConfig.configurationSteps.length, "steps");
                    }

                    // Store the saved ruleFunction (including the generated code)
                    if (savedConfig.ruleFunction) {
                        setSavedRuleFunction(savedConfig.ruleFunction);
                        if (savedConfig.ruleFunction.code) {
                            setGeneratedJsCode(savedConfig.ruleFunction.code);
                            console.log("✅ Generated JavaScript code loaded from saved configuration");
                        }
                    }

                    // Set to view mode when configuration exists (viewing existing rule)
                    setIsViewMode(true);
                    setHasUnsavedChanges(false);

                    console.log("✅ Configuration loaded successfully!");
                } else {
                    console.log("ℹ️ No saved configuration found for rule:", ruleId);
                    // No saved config means we're creating/editing a new rule - stay in edit mode
                    setIsViewMode(false);
                }
            } else {
                navigate('/rules');
            }
        } else {
            // No ruleId means creating a brand new rule - edit mode
            setIsViewMode(false);
        }
    }, [ruleId, navigate]);

    // Update active accordion keys when modal opens or search query changes
    useEffect(() => {
        if (isConfigModalOpen) {
            // Recompute which sections have data
            const userDefinedRules: string[] = [];
            const stringFunctions = SUBFUNCTIONS.filter(func => func.categoryId === 'STR' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));
            const numberFunctions = SUBFUNCTIONS.filter(func => func.categoryId === 'NUM' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));
            const dateFunctions = SUBFUNCTIONS.filter(func => func.categoryId === 'DATE' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));
            const utilFunctions = SUBFUNCTIONS.filter(func => func.categoryId === 'UTIL' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));
            const conditionalFunctions = [
                { name: 'IF', type: 'conditional' as FunctionType },
                { name: 'IFS', type: null },
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
    }, [isConfigModalOpen, searchQuery]);

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
            type: 'String',
            dataType: 'String'
        };
        const updatedParams = renumberParameters([...inputParameters, newParam]);
        setInputParameters(updatedParams);
    };

    const updateInputParameter = (id: string, field: 'fieldName' | 'type' | 'dataType', value: string) => {
        setInputParameters(inputParameters.map(param =>
            param.id === id ? { ...param, [field]: value } : param
        ));

        // Clear error when user types
        if (parameterErrors[id]?.[field]) {
            setParameterErrors(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    [field]: false
                }
            }));
        }
    };

    const removeInputParameter = (id: string) => {
        // Prevent removing if only one parameter left
        if (inputParameters.length > 1) {
            confirm({
                title: 'Remove Input Parameter',
                icon: <ExclamationCircleOutlined className="text-red-600" />,
                content: 'Are you sure you want to remove this Parameter?',
                okText: 'Yes, Remove',
                okType: 'danger',
                cancelText: 'Cancel',
                centered: true,
                onOk() {
                    const filteredParams = inputParameters.filter(param => param.id !== id);
                    const renumberedParams = renumberParameters(filteredParams);
                    setInputParameters(renumberedParams);
                },
                onCancel() {
                    // Do nothing on cancel
                },
            });
        }
    };

    const handleStartConfiguration = () => {
        // Validate input parameters
        const newErrors: Record<string, { type?: boolean; fieldName?: boolean; dataType?: boolean }> = {};
        let hasErrors = false;

        inputParameters.forEach(param => {
            const paramErrors: { type?: boolean; fieldName?: boolean; dataType?: boolean } = {};

            if (!param.type) paramErrors.type = true;
            if (!param.fieldName.trim()) paramErrors.fieldName = true;
            if (!param.dataType) paramErrors.dataType = true;

            if (Object.keys(paramErrors).length > 0) {
                newErrors[param.id] = paramErrors;
                hasErrors = true;
            }
        });

        if (hasErrors) {
            setParameterErrors(newErrors);
            return;
        }

        // Show confirmation dialog
        confirm({
            title: 'Start Configuration',
            icon: <ExclamationCircleOutlined className="text-red-600" />,
            content: 'Are you sure you want to start configuration? Once confirmed, input parameters will be locked and cannot be modified.',
            okText: 'Yes, Start',
            okType: 'danger',
            cancelText: 'No',
            centered: true,
            onOk() {
                setParametersLocked(true);
                setIsConfigModalOpen(true);
            },
            onCancel() {
                // Do nothing, keep parameters editable
            },
        });
    };

    const handleCloseConfigModal = () => {
        setIsConfigModalOpen(false);
    };

    const [insertPosition, setInsertPosition] = useState<number>(-1);
    const [activeBranchStep, setActiveBranchStep] = useState<{ stepId: string; branch: 'true' | 'false' } | null>(null);

    const handleFunctionSelect = (functionType: FunctionType, subfunctionId?: number) => {
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
            setConfigurationSteps(updatedSteps);
            setActiveBranchStep(null);
        } else {
            // Insert at the specified position or at the end
            if (insertPosition >= 0 && insertPosition <= configurationSteps.length) {
                const newSteps = [...configurationSteps];
                newSteps.splice(insertPosition + 1, 0, newStep);
                setConfigurationSteps(newSteps);
            } else {
                setConfigurationSteps([...configurationSteps, newStep]);
            }
            setInsertPosition(-1);
        }

        // Mark configuration as started only when a function is selected
        setConfigurationStarted(true);
        setHasUnsavedChanges(true); // Mark as changed when adding a step
        setIsConfigModalOpen(false);

        // Scroll to center when conditional is added
        if (functionType === 'conditional') {
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    const scrollWidth = container.scrollWidth;
                    const clientWidth = container.clientWidth;
                    const centerScroll = (scrollWidth - clientWidth) / 2;
                    container.scrollTo({ left: centerScroll, behavior: 'smooth' });
                }
            }, 100);
        }
    };

    const handleAddStep = (position: number) => {
        setInsertPosition(position);
        setIsConfigModalOpen(true);
    };

    const handleAddBranchStep = (stepId: string, branch: 'true' | 'false') => {
        setActiveBranchStep({ stepId, branch });
        setIsConfigModalOpen(true);
    };

    const handleConfigUpdate = (stepId: string, config: any) => {
        setConfigurationSteps(configurationSteps.map(step =>
            step.id === stepId ? { ...step, config } : step
        ));
        setHasUnsavedChanges(true); // Mark as changed
    };

    const handleSave = () => {
        // Generate the ruleFunction JSON structure
        const ruleFunction = {
            id: Date.now(), // Generate unique ID
            code: "", // Will be generated below
            returnType: "string", // Default, can be determined from output step
            ruleId: rule?.id || "",
            inputParams: inputParameters.map((param, index) => ({
                id: parseInt(param.id),
                sequence: index + 1,
                name: param.fieldName, // The field name entered by user
                dataType: param.dataType?.toLowerCase() || "string",
                paramType: "inputField", // Always inputField for input parameters
                mandatory: "true",
                default: "",
                description: ""
            })),
            steps: configurationSteps.map((step, index) => {
                const stepId = step.id;
                const nextStep = index < configurationSteps.length - 1 ? configurationSteps[index + 1].id : null;

                if (step.type === 'subfunction') {
                    const subfunc = SUBFUNCTIONS.find(f => f.id === step.subfunctionId);
                    const config = step.config || {};
                    const inputParams = (config.params || []).map((paramConfig: any, paramIdx: number) => {
                        let dataValue = '';
                        let dataType = '';

                        if (paramConfig.type === 'Static Value') {
                            dataType = 'static';
                            dataValue = paramConfig.value || '';
                        } else if (paramConfig.type?.startsWith('Input Parameter')) {
                            dataType = 'inputParam';
                            // Find the matching input parameter and use its fieldName for compilation
                            const matchedParam = inputParameters.find(p => p.name === paramConfig.type);
                            dataValue = matchedParam?.fieldName || '';
                        } else {
                            dataType = 'stepOutputVariable';
                            // For step output variables, the value would be the variable name
                            dataValue = paramConfig.type || '';
                        }

                        return {
                            subFuncParamId: String(paramIdx + 1),
                            data: {
                                type: dataType,
                                value: dataValue
                            }
                        };
                    });

                    return {
                        id: stepId,
                        type: "subFunction",
                        outputVariableName: config.outputVariable || `step_${index + 1}_output_variable`,
                        returnType: subfunc?.returnType?.toLowerCase() || "string",
                        subFunction: {
                            id: subfunc?.functionName || String(step.subfunctionId),
                            inputParams
                        },
                        next: nextStep
                    };
                } else if (step.type === 'conditional') {
                    return {
                        id: stepId,
                        type: "condition",
                        outputVariableName: null,
                        returnType: "boolean",
                        conditions: [], // Will be populated with condition data
                        next: {
                            true: nextStep,
                            false: null
                        }
                    };
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
                        outputValue = outputConfig.value || '';
                    }

                    return {
                        id: stepId,
                        type: "output",
                        outputVariableName: null,
                        returnType: outputConfig.dataType?.toLowerCase() || "any",
                        data: {
                            type: outputType,
                            dataType: outputConfig.dataType?.toLowerCase() || "",
                            value: outputValue
                        },
                        next: null
                    };
                }

                return null;
            }).filter(Boolean)
        };

        // Generate JavaScript code from the rule function
        // Only regenerate if there were changes or no code exists
        if (hasUnsavedChanges || !generatedJsCode) {
            console.log("🔄 Regenerating JavaScript code due to changes");
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
        } else {
            // Use existing code if no changes were made
            console.log("✅ Using existing JavaScript code (no changes detected)");
            ruleFunction.code = generatedJsCode;
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
            // Save to localStorage
            saveRuleConfiguration(configToSave);

            // Also update the rule object
            if (rule) {
                updateRule(rule.id, {
                    ruleFunction
                });
            }

            // Log the generated JSON with clear formatting
            console.log("=".repeat(80));
            console.log("✅ Configuration Saved Successfully!");
            console.log("=".repeat(80));
            console.log("Rule ID:", rule?.id);
            console.log("Rule Name:", rule?.name);
            console.log("=".repeat(80));
            console.log("Generated Rule Function JSON:");
            console.log(JSON.stringify(ruleFunction, null, 2));
            console.log("=".repeat(80));
            console.log("Full Configuration (including input params & steps):");
            console.log(JSON.stringify(configToSave, null, 2));
            console.log("=".repeat(80));
            console.log("📍 Stored in localStorage under key: 'rce_rule_configurations'");
            console.log("=".repeat(80));

            // Reset unsaved changes flag after successful save
            setHasUnsavedChanges(false);
            setSavedRuleFunction(ruleFunction);

            // Show success confirmation modal
            Modal.confirm({
                title: 'Rule Saved Successfully',
                okText: 'OK',
                centered: true,
                icon: null,
                cancelButtonProps: { style: { display: 'none' } },
                onOk() {
                    navigate('/rules');
                }
            });
        } catch (error) {
            console.error('Failed to save configuration:', error);
            Modal.error({
                title: 'Save Failed',
                content: 'Failed to save configuration. Please try again.',
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
                steps: configurationSteps.map((step, index) => {
                    const stepId = step.id;
                    const nextStep = index < configurationSteps.length - 1 ? configurationSteps[index + 1].id : null;

                    if (step.type === 'subfunction') {
                        const subfunc = SUBFUNCTIONS.find(f => f.id === step.subfunctionId);
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

                            return {
                                subFuncParamId: String(paramIdx + 1),
                                data: {
                                    type: dataType,
                                    value: dataValue
                                }
                            };
                        });

                        return {
                            id: stepId,
                            type: "subFunction",
                            outputVariableName: config.outputVariable || `step_${index + 1}_output_variable`,
                            returnType: subfunc?.returnType?.toLowerCase() || "string",
                            subFunction: {
                                id: subfunc?.functionName || String(step.subfunctionId),
                                inputParams
                            },
                            next: nextStep
                        };
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
                            outputValue = outputConfig.value || '';
                        }

                        return {
                            id: stepId,
                            type: "output",
                            outputVariableName: null,
                            returnType: outputConfig.dataType?.toLowerCase() || "any",
                            data: {
                                type: outputType,
                                dataType: outputConfig.dataType?.toLowerCase() || "",
                                value: outputValue
                            },
                            next: null
                        };
                    }

                    return null;
                }).filter(Boolean)
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
                steps: configurationSteps.map((step, index) => {
                    const stepId = step.id;
                    const nextStep = index < configurationSteps.length - 1 ? configurationSteps[index + 1].id : null;

                    if (step.type === 'subfunction') {
                        const subfunc = SUBFUNCTIONS.find(f => f.id === step.subfunctionId);
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

                            return {
                                subFuncParamId: String(paramIdx + 1),
                                data: {
                                    type: dataType,
                                    value: dataValue
                                }
                            };
                        });

                        return {
                            id: stepId,
                            type: "subFunction",
                            outputVariableName: config.outputVariable || `step_${index + 1}_output_variable`,
                            returnType: subfunc?.returnType?.toLowerCase() || "string",
                            subFunction: {
                                id: subfunc?.functionName || String(step.subfunctionId),
                                inputParams
                            },
                            next: nextStep
                        };
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
                            outputValue = outputConfig.value || '';
                        }

                        return {
                            id: stepId,
                            type: "output",
                            outputVariableName: null,
                            returnType: outputConfig.dataType?.toLowerCase() || "any",
                            data: {
                                type: outputType,
                                dataType: outputConfig.dataType?.toLowerCase() || "",
                                value: outputValue
                            },
                            next: null
                        };
                    }

                    return null;
                }).filter(Boolean)
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

    const handleViewJson = () => {
        // Generate current JSON from current state (not from saved)
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
                    paramType: param.type === "Input field" ? "inputField" :
                        param.type === "Metadata field" ? "metadataField" : "default",
                    mandatory: "true",
                    default: "",
                    description: ""
                })),
                steps: configurationSteps.map((step, index) => {
                    const stepId = step.id;
                    const nextStep = index < configurationSteps.length - 1 ? configurationSteps[index + 1].id : null;

                    if (step.type === 'subfunction') {
                        const subfunc = SUBFUNCTIONS.find(f => f.id === step.subfunctionId);
                        const config = step.config || {};
                        return {
                            id: stepId,
                            type: "subFunction",
                            outputVariableName: config.outputVariable || `step_${index + 1}_output_variable`,
                            returnType: subfunc?.returnType?.toLowerCase() || "string",
                            subFunction: { id: step.subfunctionId, inputParams: [] },
                            next: nextStep
                        };
                    } else if (step.type === 'output') {
                        const outputConfig = step.config || {};
                        return {
                            id: stepId,
                            type: "output",
                            outputVariableName: null,
                            returnType: outputConfig.dataType?.toLowerCase() || "any",
                            data: {
                                type: outputConfig.type || "",
                                dataType: outputConfig.dataType?.toLowerCase() || "",
                                value: ""
                            },
                            next: null
                        };
                    }
                    return null;
                }).filter(Boolean)
            };
            setCurrentJson(ruleFunction);
            setIsJsonModalOpen(true);
        } else {
            alert("No configuration steps found. Please add some steps first.");
        }
    };

    const handleCopyJson = () => {
        if (currentJson) {
            navigator.clipboard.writeText(JSON.stringify(currentJson, null, 2));
            alert("JSON copied to clipboard!");
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
                    { id: '1', name: 'Input Parameter 1', fieldName: '', type: 'Input field', dataType: 'String' }
                ]);
                setConfigurationSteps([]);
                setConfigurationStarted(false);
                setParametersLocked(false);
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

    const stringFunctions = SUBFUNCTIONS.filter(func => func.categoryId === 'STR' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const numberFunctions = SUBFUNCTIONS.filter(func => func.categoryId === 'NUM' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const dateFunctions = SUBFUNCTIONS.filter(func => func.categoryId === 'DATE' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const utilFunctions = SUBFUNCTIONS.filter(func => func.categoryId === 'UTIL' && func.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const conditionalFunctions = [
        { name: 'IF', type: 'conditional' as FunctionType },
        { name: 'IFS', type: null },
    ].filter(func => func.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50">
                {/* Main Content Area */}
                <div className="px-8 py-6 max-w-full">
                    {/* Rule Title and Action Buttons */}
                    <div className="mb-6 max-w-full overflow-hidden flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                            <Tooltip title={rule.name}>
                                <h1 className="text-xl font-bold text-gray-900 truncate cursor-pointer">{rule.name}</h1>
                            </Tooltip>
                            <Tooltip title={rule.description}>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2 cursor-pointer">{rule.description}</p>
                            </Tooltip>
                        </div>

                        {/* Action Buttons - Top Right */}
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
                                        Generate JS Code
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
                    </div>

                    {/* Scrollable Container for entire rule tree */}
                    <div ref={scrollContainerRef} className="overflow-x-auto pb-4">
                        <div className="min-w-fit flex flex-col items-center">
                            {/* Define Input Parameters */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 pb-8 mb-6 w-full" style={{ maxWidth: '1100px' }}>
                        <div className="flex items-start justify-between mb-1">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                                    {isViewMode ? 'Input Parameters' : 'Define Input Parameters'}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {inputParameters.length} parameter{inputParameters.length !== 1 ? 's' : ''} defined
                                </p>
                            </div>
                            {!isViewMode && (
                                <Button
                                    icon={<PlusOutlined />}
                                    type="primary"
                                    size="middle"
                                    onClick={addInputParameter}
                                    disabled={parametersLocked}
                                    className="bg-red-500 hover:bg-red-400 focus:bg-red-400 border-none rounded-lg px-6 disabled:bg-gray-300 disabled:text-gray-500"
                                >
                                    Add Parameter
                                </Button>
                            )}
                        </div>

                        {isViewMode ? (
                            /* Table View for View Mode */
                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Field Name</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data Type</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {inputParameters.map((param) => (
                                            <tr key={param.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">{param.type}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{param.fieldName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{param.dataType}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                                disabled={parametersLocked}
                                                status={parameterErrors[param.id]?.type ? 'error' : undefined}
                                                options={[
                                                    { label: 'Input field', value: 'Input field' },
                                                    { label: 'Metadata field', value: 'Metadata field' },
                                                    { label: 'String', value: 'String' }
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
                                                {param.type === 'Metadata field' ? 'Metadata Field Name' :
                                                    param.type === 'String' || param.type === 'Number' || param.type === 'Date' || param.type === 'Boolean' ? 'Parameter Name' :
                                                        'Field Name'} <span className="text-black">*</span>
                                            </Label>
                                            <Input
                                                value={param.fieldName}
                                                onChange={(e) => updateInputParameter(param.id, 'fieldName', e.target.value)}
                                                placeholder={
                                                    param.type === 'Metadata field' ? 'Enter metadata field name' :
                                                        param.type === 'String' || param.type === 'Number' || param.type === 'Date' || param.type === 'Boolean' ? 'Enter parameter name' :
                                                            'Enter field name'
                                                }
                                                className="w-full"
                                                inputSize="lg"
                                                variant={parameterErrors[param.id]?.fieldName ? 'error' : 'default'}
                                                disabled={parametersLocked}
                                            />
                                            {parameterErrors[param.id]?.fieldName && (
                                                <span className="text-red-500 text-xs mt-1 block">This field is required</span>
                                            )}
                                        </div>

                                        {/* Field Data Type Column */}
                                        <div>
                                            <Label className="text-sm font-medium text-gray-700 mb-2 block">Field Data Type <span className="text-black">*</span></Label>
                                            <Select
                                                showSearch
                                                value={param.dataType || 'String'}
                                                onChange={(value) => updateInputParameter(param.id, 'dataType', value)}
                                                placeholder="Select data type"
                                                className="w-full"
                                                size="large"
                                                disabled={parametersLocked}
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
                                            {inputParameters.length > 1 && !parametersLocked && (
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
                        <div className="flex flex-col items-center py-5">
                            <p className="text-base font-semibold text-gray-900 mb-4">Start Configuration</p>
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleStartConfiguration}
                                disabled={configurationStarted || configurationSteps.length > 0}
                                className="bg-red-500 hover:bg-red-400 focus:bg-red-400 border-none rounded-lg px-8 disabled:bg-gray-300 disabled:text-gray-500"
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
                                // Check if there's a conditional card in the steps
                                const hasConditional = configurationSteps.some(s => s.type === 'conditional');
                                // Add padding if this is not a conditional card and there is a conditional somewhere
                                const shouldAddPadding = hasConditional && step.type !== 'conditional';

                                return (
                                <div key={step.id} className="w-full flex justify-center" style={step.type === 'conditional' ? { minWidth: '1600px' } : {}}>
                                    <div className="w-full" style={step.type !== 'conditional' ? { maxWidth: '800px' } : {}}>
                                    <RuleConfigurationCard
                                        step={step}
                                        inputParameters={inputParameters}
                                        stepIndex={index}
                                        configurationSteps={configurationSteps}
                                        onConfigUpdate={handleConfigUpdate}
                                        onAddBranchStep={(branch) => handleAddBranchStep(step.id, branch)}
                                        handleAddBranchStep={handleAddBranchStep}
                                        isViewMode={isViewMode}
                                    />

                                    {/* Vertical connector line - Don't show after output card or conditional card */}
                                    {step.type !== 'output' && step.type !== 'conditional' && (
                                        <div className="h-10 w-px bg-gray-300 mx-auto -mt-6"></div>
                                    )}

                                    {/* Add Button - Only show for the last card if it's not an output card or conditional card */}
                                    {!isViewMode && index === configurationSteps.length - 1 && step.type !== 'output' && step.type !== 'conditional' && (
                                        <div className="flex justify-center mb-8">
                                            <Button
                                                type="primary"
                                                className="border-none px-8 h-10 rounded-md bg-red-500 hover:bg-red-400"
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

                            {/* Action Buttons */}
                            {!isViewMode && (
                                <div className="flex justify-end items-center py-6 gap-3">
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
                        </>
                    )}
                        </div>
                    </div>
                </div>
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

                        {/* Output Card */}
                        <Panel header={<span className="font-semibold text-gray-900">Output Card</span>} key="4">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    onClick={() => handleFunctionSelect('output')}
                                    className="rounded-full border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500"
                                    size="small"
                                >
                                    Standard Card
                                </Button>
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
                            {rightPanelContent === 'js' ? 'Generated JavaScript Code' : 'Test Rule'}
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
