import { useState, useEffect } from 'react';
import { Select, DatePicker, InputNumber } from 'antd';
import dayjs from 'dayjs';
import { ConfigurationStep, InputParameter } from '../../types/rule-configuration';
import { SUBFUNCTIONS } from '../../constants/subfunctions';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import OutputCard from './OutputCard';
import ConditionalCard from './ConditionalCard';
import { DataType } from '../../types/subfunction';
import { formatStepId } from '../../utils/stepIdGenerator';

// Helper function to check if input data type matches expected data type
const isDataTypeCompatible = (expectedType: DataType, selectedType: string): boolean => {
    // ANY type accepts all data types
    if (expectedType === 'ANY') return true;

    // Direct match
    if (expectedType === selectedType) return true;

    return false;
};

// Helper function to get user-friendly data type name
const getDataTypeName = (dataType: DataType | string): string => {
    const typeMap: { [key: string]: string } = {
        'STRING': 'String',
        'NUMBER': 'Number',
        'BOOLEAN': 'Boolean',
        'DATE': 'Date',
        'ANY': 'Any'
    };
    return typeMap[dataType] || dataType;
};

// Helper function to collect all output variable names from steps (including nested conditionals)
const collectAllOutputVariables = (steps: ConfigurationStep[], excludeStepId?: string): string[] => {
    const variables: string[] = [];

    const collectFromSteps = (stepsToSearch: ConfigurationStep[]) => {
        stepsToSearch.forEach(s => {
            if (s.type === 'subfunction' && s.config?.outputVariable && s.id !== excludeStepId) {
                variables.push(s.config.outputVariable.trim().toLowerCase());
            }
            if (s.type === 'conditional' && s.config?.next) {
                if (s.config.next.true) collectFromSteps(s.config.next.true);
                if (s.config.next.false) collectFromSteps(s.config.next.false);
            }
        });
    };

    collectFromSteps(steps);
    return variables;
};

interface RuleConfigurationCardProps {
    step: ConfigurationStep;
    inputParameters: InputParameter[];
    stepIndex: number;
    configurationSteps?: ConfigurationStep[];
    onConfigUpdate?: (stepId: string, config: any) => void;
    onAddBranchStep?: (branch: 'true' | 'false') => void;
    handleAddBranchStep?: (stepId: string, branch: 'true' | 'false') => void;
    handleDeleteBranchStep?: (parentStepId: string, stepIdToDelete: string, branch: 'true' | 'false') => void;
    handleDeleteMainFlowStep?: (stepId: string) => void;
    canDelete?: boolean;
    isViewMode?: boolean;
    // All configuration steps for validation (includes all steps, not just preceding ones)
    allConfigurationSteps?: ConfigurationStep[];
    // Flag to control when to show validation errors
    shouldShowValidation?: boolean;
    // Callback to notify parent about validation status
    onValidationStatusChange?: (stepId: string, hasErrors: boolean) => void;
}

export default function RuleConfigurationCard({ step, inputParameters, stepIndex, configurationSteps = [], onConfigUpdate, onAddBranchStep, handleAddBranchStep, handleDeleteBranchStep, handleDeleteMainFlowStep, canDelete = false, isViewMode = false, allConfigurationSteps, shouldShowValidation = false, onValidationStatusChange }: RuleConfigurationCardProps) {
    if (!step.type) return null;

    // Use allConfigurationSteps if provided, otherwise fall back to configurationSteps for backward compatibility
    const stepsForValidation = allConfigurationSteps || configurationSteps;

    // Map category IDs to full names
    const getCategoryName = (categoryId: string) => {
        const categoryMap: { [key: string]: string } = {
            'STR': 'String Function',
            'NUM': 'Number Function',
            'DATE': 'Date Function',
            'UTIL': 'Utility Function'
        };
        return categoryMap[categoryId] || categoryId;
    };

    switch (step.type) {
        case 'subfunction': {
            const subfunc = SUBFUNCTIONS.find(f => f.id === step.subfunctionId);
            if (!subfunc) return null;

            const config = step.config || { params: [], outputVariable: `step_${stepIndex + 1}_output_variable` };

            // State for parameter validation errors
            const [paramErrors, setParamErrors] = useState<Record<number, { type?: string; dataType?: string; value?: string }>>({});

            // Validate parameter based on subfunction configuration
            const validateParameter = (paramConfig: any, paramDef: any) => {
                const errors: { type?: string; dataType?: string; value?: string } = {};

                // Check if mandatory parameter has a type selected
                if (paramDef.mandatory && !paramConfig.type) {
                    errors.type = `${paramDef.label || paramDef.name} is required`;
                }

                // If Static Value is selected, validate data type and value
                if (paramConfig.type === 'Static Value') {
                    if (!paramConfig.dataType) {
                        errors.dataType = 'Data type is required';
                    } else if (!isDataTypeCompatible(paramDef.dataType, paramConfig.dataType)) {
                        errors.dataType = `Expected ${getDataTypeName(paramDef.dataType)} but got ${getDataTypeName(paramConfig.dataType)}`;
                    }

                    if (paramDef.mandatory && !paramConfig.value?.trim()) {
                        errors.value = 'Value is required';
                    }
                } else if (paramConfig.type && paramConfig.type !== 'Static Value') {
                    // Validate data type compatibility for input parameters and step outputs
                    // Find the selected parameter or output variable
                    const inputParam = inputParameters.find(p => p.name === paramConfig.type);
                    if (inputParam) {
                        // Check if input parameter data type is compatible
                        const inputDataType = inputParam.dataType?.toUpperCase();
                        if (inputDataType && !isDataTypeCompatible(paramDef.dataType, inputDataType)) {
                            errors.type = `Expected ${getDataTypeName(paramDef.dataType)} but "${inputParam.fieldName}" is ${getDataTypeName(inputDataType)}`;
                        }
                    }
                    // For step output variables, we would need to check their return types
                    // but that's more complex and may require additional context
                }

                return errors;
            };

            // Validate all parameters - compute errors silently
            useEffect(() => {
                if (isViewMode) return;

                const newErrors: Record<number, { type?: string; dataType?: string; value?: string }> = {};
                subfunc.inputParams?.forEach((param, idx) => {
                    const paramConfig = config.params?.[idx] || {};
                    const errors = validateParameter(paramConfig, param);
                    if (Object.keys(errors).length > 0) {
                        newErrors[idx] = errors;
                    }
                });
                setParamErrors(newErrors);

                // Notify parent about validation status
                if (onValidationStatusChange) {
                    const hasErrors = Object.keys(newErrors).length > 0;
                    onValidationStatusChange(step.id, hasErrors);
                }
            }, [config.params, isViewMode, step.id, onValidationStatusChange]);

            const handleParamTypeChange = (paramIndex: number, type: string) => {
                const updatedParams = [...(config.params || [])];
                updatedParams[paramIndex] = {
                    ...(updatedParams[paramIndex] || {}),
                    type,
                    dataType: type === 'Static Value' ? '' : undefined,
                    value: ''
                };
                if (onConfigUpdate) {
                    onConfigUpdate(step.id, { ...config, params: updatedParams });
                }
            };

            const handleParamDataTypeChange = (paramIndex: number, dataType: string) => {
                const updatedParams = [...(config.params || [])];
                updatedParams[paramIndex] = {
                    ...(updatedParams[paramIndex] || {}),
                    dataType
                };
                if (onConfigUpdate) {
                    onConfigUpdate(step.id, { ...config, params: updatedParams });
                }
            };

            const handleParamValueChange = (paramIndex: number, value: string) => {
                const updatedParams = [...(config.params || [])];
                updatedParams[paramIndex] = {
                    ...(updatedParams[paramIndex] || {}),
                    value
                };
                if (onConfigUpdate) {
                    onConfigUpdate(step.id, { ...config, params: updatedParams });
                }
            };

            const handleOutputVariableChange = (value: string) => {
                if (onConfigUpdate) {
                    onConfigUpdate(step.id, { ...config, outputVariable: value });
                }
            };

            // Generate step number display text using hierarchical step ID
            const stepNumberText = formatStepId(step.stepId);

            // Check if output variable is duplicate
            const currentOutputVar = (config.outputVariable ?? `step_${stepIndex + 1}_output_variable`).trim().toLowerCase();
            const allOtherOutputVars = collectAllOutputVariables(stepsForValidation, step.id);
            const inputParamFieldNames = inputParameters.map(p => p.fieldName.trim().toLowerCase());
            const isOutputVarDuplicate = currentOutputVar && (
                allOtherOutputVars.includes(currentOutputVar) ||
                inputParamFieldNames.includes(currentOutputVar)
            );

            return (
                <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 relative" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {/* Step Number Badge and Category - Top Right Corner */}
                    <div className="absolute top-3 right-12 flex flex-row items-center gap-2">
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            {stepNumberText}
                        </div>
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            {getCategoryName(subfunc.categoryId || 'Function')}
                        </div>
                    </div>

                    {/* Title Section */}
                    <div className="mb-6 pr-24">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {subfunc.name}
                        </h3>
                        <p className="text-sm text-gray-500">{subfunc.description}</p>
                    </div>

                    {/* Input Parameters Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {subfunc.inputParams?.map((param, idx) => {
                            const paramConfig = config.params?.[idx] || {};

                            // Build options for Type dropdown
                            const typeOptions = [
                                ...inputParameters.map(p => ({
                                    label: <div title={p.fieldName} className="truncate">{p.fieldName}</div>,
                                    value: p.name,
                                    searchLabel: p.fieldName
                                })),
                                ...configurationSteps
                                    .slice(0, stepIndex)
                                    .filter(s => s.type === 'subfunction' && s.config?.outputVariable)
                                    .map((s) => ({
                                        label: <div title={s.config.outputVariable} className="truncate">{s.config.outputVariable}</div>,
                                        value: s.config.outputVariable,
                                        searchLabel: s.config.outputVariable
                                    })),
                                { label: 'Static Value', value: 'Static Value', searchLabel: 'Static Value' }
                            ];

                            return (
                                <div key={idx}>
                                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                        {param.label || param.name} {param.mandatory && <span className="text-black">*</span>}
                                    </Label>
                                    <Select
                                        showSearch
                                        value={paramConfig.type || undefined}
                                        onChange={(value) => handleParamTypeChange(idx, value)}
                                        placeholder={`Select ${param.label || param.name}`}
                                        className="w-full"
                                        size="large"
                                        status={shouldShowValidation && paramErrors[idx]?.type ? 'error' : undefined}
                                        options={typeOptions}
                                        filterOption={(input, option: any) =>
                                            (option?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        popupMatchSelectWidth={true}
                                        listHeight={256}
                                        disabled={isViewMode}
                                    />
                                    {shouldShowValidation && paramErrors[idx]?.type && (
                                        <span className="text-red-500 text-xs mt-1 block">
                                            {paramErrors[idx].type}
                                        </span>
                                    )}
                                    {paramConfig.type === 'Static Value' && (
                                        (() => {
                                            return (
                                                <div className="mt-2 space-y-2">
                                                    <Select
                                                        value={paramConfig.dataType || undefined}
                                                        onChange={(value) => handleParamDataTypeChange(idx, value)}
                                                        placeholder="Select data type"
                                                        className="w-full"
                                                        size="large"
                                                        status={shouldShowValidation && paramErrors[idx]?.dataType ? 'error' : undefined}
                                                        options={[
                                                            { label: 'String', value: 'STRING' },
                                                            { label: 'Number', value: 'NUMBER' },
                                                            { label: 'Boolean', value: 'BOOLEAN' },
                                                            { label: 'Date', value: 'DATE' }
                                                        ]}
                                                        disabled={isViewMode}
                                                    />
                                                    {shouldShowValidation && paramErrors[idx]?.dataType && (
                                                        <span className="text-red-500 text-xs block">
                                                            {paramErrors[idx].dataType}
                                                        </span>
                                                    )}
                                                    {/* Render input based on selected data type */}
                                                    {paramConfig.dataType === 'DATE' ? (
                                                        <DatePicker
                                                            value={paramConfig.value ? dayjs(paramConfig.value) : null}
                                                            onChange={(date) => handleParamValueChange(idx, date ? date.format('YYYY-MM-DD') : '')}
                                                            placeholder="Select date"
                                                            className="w-full"
                                                            size="large"
                                                            status={shouldShowValidation && paramErrors[idx]?.value ? 'error' : undefined}
                                                            disabled={isViewMode}
                                                        />
                                                    ) : paramConfig.dataType === 'NUMBER' ? (
                                                        <InputNumber
                                                            value={paramConfig.value ? Number(paramConfig.value) : null}
                                                            onChange={(value) => handleParamValueChange(idx, value !== null ? String(value) : '')}
                                                            placeholder="Enter number"
                                                            className="w-full"
                                                            size="large"
                                                            status={shouldShowValidation && paramErrors[idx]?.value ? 'error' : undefined}
                                                            disabled={isViewMode}
                                                            style={{ width: '100%' }}
                                                        />
                                                    ) : paramConfig.dataType === 'BOOLEAN' ? (
                                                        <Select
                                                            value={paramConfig.value || undefined}
                                                            onChange={(value) => handleParamValueChange(idx, value)}
                                                            placeholder="Select boolean value"
                                                            className="w-full"
                                                            size="large"
                                                            status={shouldShowValidation && paramErrors[idx]?.value ? 'error' : undefined}
                                                            options={[
                                                                { label: 'True', value: 'true' },
                                                                { label: 'False', value: 'false' }
                                                            ]}
                                                            disabled={isViewMode}
                                                        />
                                                    ) : (
                                                        <Input
                                                            value={paramConfig.value || ''}
                                                            onChange={(e) => handleParamValueChange(idx, e.target.value)}
                                                            placeholder="Enter static value"
                                                            className="w-full"
                                                            inputSize="lg"
                                                            variant={shouldShowValidation && paramErrors[idx]?.value ? 'error' : 'default'}
                                                            disabled={isViewMode}
                                                        />
                                                    )}
                                                    {shouldShowValidation && paramErrors[idx]?.value && (
                                                        <span className="text-red-500 text-xs block">
                                                            {paramErrors[idx].value}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Output Variable */}
                    <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">Output Variable</Label>
                            <div className="flex flex-col items-end">
                                <Input
                                    value={config.outputVariable ?? `step_${stepIndex + 1}_output_variable`}
                                    onChange={(e) => handleOutputVariableChange(e.target.value)}
                                    className="w-64"
                                    inputSize="lg"
                                    disabled={isViewMode}
                                    variant={isOutputVarDuplicate ? 'error' : 'default'}
                                />
                                {isOutputVarDuplicate && (
                                    <span className="text-red-500 text-xs mt-1">Variable name must be unique</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        case 'conditional':
            return (
                <ConditionalCard
                    step={step}
                    inputParameters={inputParameters}
                    configurationSteps={configurationSteps}
                    stepIndex={stepIndex}
                    onConfigUpdate={onConfigUpdate}
                    onAddBranchStep={onAddBranchStep}
                    handleAddBranchStep={handleAddBranchStep}
                    handleDeleteBranchStep={handleDeleteBranchStep}
                    handleDeleteMainFlowStep={handleDeleteMainFlowStep}
                    canDelete={canDelete}
                    isViewMode={isViewMode}
                    allConfigurationSteps={allConfigurationSteps}
                />
            );

        case 'output':
            return (
                <OutputCard
                    step={step}
                    inputParameters={inputParameters}
                    isViewMode={isViewMode}
                    configurationSteps={configurationSteps}
                    stepIndex={stepIndex}
                    onConfigUpdate={onConfigUpdate || (() => { })}
                />
            );

        default:
            return null;
    }
}
