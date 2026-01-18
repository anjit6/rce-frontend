import { Select } from 'antd';
import { ConfigurationStep, InputParameter } from '../../types/rule-configuration';
import { SUBFUNCTIONS } from '../../constants/subfunctions';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import OutputCard from './OutputCard';
import ConditionalCard from './ConditionalCard';

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
    isViewMode?: boolean;
    // Step number display props
    stepNumber?: number; // Main step number (e.g., 2 in "Step 2")
    conditionStepNumber?: number; // Sub-step number within condition branch (e.g., 1 in "Step 2 (1)")
    // All configuration steps for validation (includes all steps, not just preceding ones)
    allConfigurationSteps?: ConfigurationStep[];
}

export default function RuleConfigurationCard({ step, inputParameters, stepIndex, configurationSteps = [], onConfigUpdate, onAddBranchStep, handleAddBranchStep, isViewMode = false, stepNumber, conditionStepNumber, allConfigurationSteps }: RuleConfigurationCardProps) {
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

            // Generate step number display text
            const displayStepNumber = stepNumber !== undefined ? stepNumber : stepIndex + 1;
            const stepNumberText = conditionStepNumber !== undefined
                ? `Step ${displayStepNumber} (${conditionStepNumber})`
                : `Step ${displayStepNumber}`;

            // Check if output variable is duplicate
            const currentOutputVar = (config.outputVariable || `step_${stepIndex + 1}_output_variable`).trim().toLowerCase();
            const allOtherOutputVars = collectAllOutputVariables(stepsForValidation, step.id);
            const inputParamFieldNames = inputParameters.map(p => p.fieldName.trim().toLowerCase());
            const isOutputVarDuplicate = currentOutputVar && (
                allOtherOutputVars.includes(currentOutputVar) ||
                inputParamFieldNames.includes(currentOutputVar)
            );

            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 relative" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {/* Step Number Badge - Top Right Corner */}
                    <div className="absolute top-3 right-3 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        {stepNumberText}
                    </div>

                    {/* Title Section with Category Badge */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2 pr-24">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {subfunc.name}
                            </h3>
                            <span className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded">
                                {getCategoryName(subfunc.categoryId || 'Function')}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">{subfunc.description}</p>
                    </div>

                    {/* Input Parameters Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {subfunc.inputParams?.map((param, idx) => {
                            const paramConfig = config.params?.[idx] || {};

                            // Build options for Type dropdown
                            const typeOptions = [
                                ...inputParameters.map(p => ({
                                    label: p.fieldName,
                                    value: p.name
                                })),
                                ...configurationSteps
                                    .slice(0, stepIndex)
                                    .filter(s => s.type === 'subfunction' && s.config?.outputVariable)
                                    .map((s) => ({
                                        label: s.config.outputVariable,
                                        value: s.config.outputVariable
                                    })),
                                { label: 'Static Value', value: 'Static Value' }
                            ];

                            return (
                                <div key={idx}>
                                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                        {param.label || param.name}
                                    </Label>
                                    <Select
                                        showSearch
                                        value={paramConfig.type || undefined}
                                        onChange={(value) => handleParamTypeChange(idx, value)}
                                        placeholder={`Select ${param.label || param.name}`}
                                        className="w-full"
                                        size="large"
                                        options={typeOptions}
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        popupMatchSelectWidth={false}
                                        listHeight={256}
                                        disabled={isViewMode}
                                    />
                                    {paramConfig.type === 'Static Value' && (
                                        <div className="mt-2 space-y-2">
                                            <Select
                                                value={paramConfig.dataType || undefined}
                                                onChange={(value) => handleParamDataTypeChange(idx, value)}
                                                placeholder="Select data type"
                                                className="w-full"
                                                size="large"
                                                options={[
                                                    { label: 'String', value: 'STRING' },
                                                    { label: 'Number', value: 'NUMBER' },
                                                    { label: 'Boolean', value: 'BOOLEAN' },
                                                    { label: 'Date', value: 'DATE' }
                                                ]}
                                                disabled={isViewMode}
                                            />
                                            <Input
                                                value={paramConfig.value || ''}
                                                onChange={(e) => handleParamValueChange(idx, e.target.value)}
                                                placeholder="Enter static value"
                                                className="w-full"
                                                inputSize="lg"
                                                disabled={isViewMode}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Output Variable */}
                    <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-900">Output Variable</Label>
                            <div className="flex flex-col items-end">
                                <Input
                                    value={config.outputVariable || `step_${stepIndex + 1}_output_variable`}
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
                    isViewMode={isViewMode}
                    stepNumber={stepNumber}
                    conditionStepNumber={conditionStepNumber}
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
                    stepNumber={stepNumber}
                    conditionStepNumber={conditionStepNumber}
                />
            );

        default:
            return null;
    }
}
