import { Select } from 'antd';
import { ConfigurationStep, InputParameter } from '../../types/rule-configuration';
import { SUBFUNCTIONS } from '../../constants/subfunctions';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import OutputCard from './OutputCard';
import ConditionalCard from './ConditionalCard';

interface RuleConfigurationCardProps {
    step: ConfigurationStep;
    inputParameters: InputParameter[];
    stepIndex: number;
    configurationSteps?: ConfigurationStep[];
    onConfigUpdate?: (stepId: string, config: any) => void;
    onAddBranchStep?: (branch: 'true' | 'false') => void;
    handleAddBranchStep?: (stepId: string, branch: 'true' | 'false') => void;
    isViewMode?: boolean;
}

export default function RuleConfigurationCard({ step, inputParameters, stepIndex, configurationSteps = [], onConfigUpdate, onAddBranchStep, handleAddBranchStep, isViewMode = false }: RuleConfigurationCardProps) {
    if (!step.type) return null;

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

            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 relative" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {/* Title Section with Category Badge */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
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
                            <Input
                                value={config.outputVariable || `step_${stepIndex + 1}_output_variable`}
                                onChange={(e) => handleOutputVariableChange(e.target.value)}
                                className="w-64"
                                inputSize="lg"
                                disabled={isViewMode}
                            />
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
