import { ConfigurationStep, InputParameter } from '../../types/rule-configuration';
import { Select } from 'antd';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface OutputCardProps {
    step: ConfigurationStep;
    inputParameters: InputParameter[];
    configurationSteps: ConfigurationStep[];
    stepIndex: number;
    onConfigUpdate: (stepId: string, config: any) => void;
    isViewMode?: boolean;
    // Step number display props
    stepNumber?: number; // Main step number (e.g., 2 in "Step 2")
    conditionStepNumber?: number; // Sub-step number within condition branch (e.g., 1 in "Step 2 (1)")
}

export default function OutputCard({ step, inputParameters, configurationSteps, stepIndex, onConfigUpdate, isViewMode = false, stepNumber, conditionStepNumber }: OutputCardProps) {
    const config = step.config || { type: '', dataType: '', value: '', staticValue: ''  };

    // Get output variables from all previous steps
    const previousOutputVariables = configurationSteps
        .slice(0, stepIndex)
        .filter(s => s.type === 'subfunction' && s.config?.outputVariable)
        .map(s => s.config.outputVariable);

    // Build options for Type dropdown
    const typeOptions = [
        ...inputParameters.map(p => ({
            label: p.fieldName,
            value: p.name
        })),
        ...previousOutputVariables.map(varName => ({
            label: varName,
            value: varName
        })),
        { label: 'Static Value', value: 'Static Value' }
    ];

    const handleValueChange = (selectedValue: string) => {
        let type = '';

        // Determine type based on selected value
        if (selectedValue === 'Static Value') {
            type = 'static';
        } else if (inputParameters.some(p => p.name === selectedValue)) {
            type = 'inputParam';
        } else {
            type = 'stepOutputVariable';
        }

        onConfigUpdate(step.id, {
            ...config,
            type: type,
            value: selectedValue,
            staticValue: selectedValue === 'Static Value' ? '' : config.staticValue
        });
    };

    const handleDataTypeChange = (value: string) => {
        onConfigUpdate(step.id, {
            ...config,
            dataType: value
        });
    };

    const handleStaticValueChange = (staticValue: string) => {
        onConfigUpdate(step.id, {
            ...config,
            staticValue: staticValue
        });
    };

    // Generate step number display text
    const displayStepNumber = stepNumber !== undefined ? stepNumber : stepIndex + 1;
    const stepNumberText = conditionStepNumber !== undefined
        ? `Step ${displayStepNumber} (${conditionStepNumber})`
        : `Step ${displayStepNumber}`;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 relative" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Step Number Badge - Top Right Corner */}
            <div className="absolute top-3 right-3 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                {stepNumberText}
            </div>

            {/* Title Section - Similar to Define Input Parameters */}
            <div className="flex items-start justify-between mb-1 pr-24">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Return</h2>
                    <p className="text-sm text-gray-600">Define the final output of the rule</p>
                </div>
                <span className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 rounded">
                    Output
                </span>
            </div>

            {/* Type Selection and Data Type */}
            <div className="mt-6">
                <div className="grid grid-cols-2 gap-4 items-start">
                    {/* First Dropdown - Type Selection (shows actual values) */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Type <span className="text-black">*</span>
                        </Label>
                        <Select
                            showSearch
                            value={config.value || undefined}
                            onChange={handleValueChange}
                            placeholder="Select type"
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
                    </div>

                    {/* Second Dropdown - Data Type */}
                    <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Data Type <span className="text-black">*</span>
                        </Label>
                        <Select
                            value={config.dataType || undefined}
                            onChange={handleDataTypeChange}
                            placeholder="Select data type"
                            className="w-full"
                            size="large"
                            options={[
                                { label: 'String', value: 'String' },
                                { label: 'Integer', value: 'Integer' },
                                { label: 'Float', value: 'Float' },
                                { label: 'Boolean', value: 'Boolean' },
                                { label: 'Date', value: 'Date' }
                            ]}
                            disabled={isViewMode}
                        />
                    </div>
                </div>

                {/* Static Value Input - Show only when "Static Value" is selected */}
                {config.value === 'Static Value' && (
                    <div className="mt-4">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Static Value <span className="text-black">*</span>
                        </Label>
                        <Input
                            type={config.dataType === 'Date' ? 'date' : (config.dataType === 'Integer' || config.dataType === 'Float') ? 'number' : 'text'}
                            value={config.staticValue || ''}
                            onChange={(e) => handleStaticValueChange(e.target.value)}
                            placeholder="Enter static value"
                            className="w-full"
                            inputSize="lg"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
