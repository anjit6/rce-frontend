import { ConfigurationStep, InputParameter } from '../../types/rule-configuration';
import { Select } from 'antd';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { SUBFUNCTIONS } from '../../constants/subfunctions';

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
    const config = step.config || { responseType: 'success', type: '', dataType: '', value: '', staticValue: '', errorMessage: '', errorCode: '' };

    // Ensure responseType has a default value
    const responseType = config.responseType || 'success';

    // Get output variables from all previous steps
    const previousOutputVariables = configurationSteps
        .slice(0, stepIndex)
        .filter(s => s.type === 'subfunction' && s.config?.outputVariable)
        .map(s => s.config.outputVariable);

    // Build options for Type dropdown
    const typeOptions = [
        ...inputParameters.map(p => ({
            label: <div title={p.fieldName} className="truncate">{p.fieldName}</div>,
            value: p.name,
            searchLabel: p.fieldName
        })),
        ...previousOutputVariables.map(varName => ({
            label: <div title={varName} className="truncate">{varName}</div>,
            value: varName,
            searchLabel: varName
        })),
        { label: 'Static Value', value: 'Static Value', searchLabel: 'Static Value' }
    ];

    const handleValueChange = (selectedValue: string) => {
        let type = '';
        let newDataType = ''; // Variable to hold the auto-detected data type

        // Determine type based on selected value
        if (selectedValue === 'Static Value') {
            type = 'static';
            newDataType = 'String';
        } else {
            // Check input parameters
            const inputParam = inputParameters.find(p => p.name === selectedValue);
            if (inputParam) {
                type = 'inputParam';
                newDataType = inputParam.dataType || 'String';
            } else {
                type = 'stepOutputVariable';
                // Find the step that produced this variable
                const step = configurationSteps.find(s => s.config?.outputVariable === selectedValue);
                if (step && step.type === 'subfunction' && step.subfunctionId) {
                    const subfunc = SUBFUNCTIONS.find(sf => sf.id === step.subfunctionId);
                    if (subfunc && subfunc.returnType) {
                        // Map returnType (UPPERCASE) to DataType (PascalCase)
                        switch (subfunc.returnType) {
                            case 'STRING': newDataType = 'String'; break;
                            case 'NUMBER': newDataType = 'Integer'; break; // Default to Integer
                            case 'BOOLEAN': newDataType = 'Boolean'; break;
                            case 'DATE': newDataType = 'Date'; break;
                            default: newDataType = 'String';
                        }
                    }
                }
            }
        }

        onConfigUpdate(step.id, {
            ...config,
            type: type,
            value: selectedValue,
            dataType: newDataType || config.dataType, // Use new detected type, or keep existing if detection failed
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

    const handleResponseTypeChange = (value: string) => {
        onConfigUpdate(step.id, {
            ...config,
            responseType: value,
            // Clear other fields when switching response type
            ...(value === 'error' ? { type: '', dataType: '', value: '', staticValue: '' } : { errorMessage: '', errorCode: '' })
        });
    };

    const handleErrorMessageChange = (errorMessage: string) => {
        onConfigUpdate(step.id, {
            ...config,
            errorMessage: errorMessage
        });
    };

    // Generate step number display text
    const displayStepNumber = stepNumber !== undefined ? stepNumber : stepIndex + 1;
    const stepNumberText = conditionStepNumber !== undefined
        ? `Step ${displayStepNumber} (${conditionStepNumber})`
        : `Step ${displayStepNumber}`;

    return (
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 relative" style={{ maxWidth: '800px', margin: '0 auto' }}>
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

            {/* Response Type and other fields */}
            <div className="mt-6">
                {/* When Response Type is Error - show Response Type and Error Message in same row */}
                {responseType === 'error' && (
                    <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="min-w-0">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Response Type <span className="text-black">*</span>
                            </Label>
                            <Select
                                value={responseType}
                                onChange={handleResponseTypeChange}
                                placeholder="Select response type"
                                className="w-full"
                                size="large"
                                options={[
                                    { label: 'Success', value: 'success' },
                                    { label: 'Error', value: 'error' }
                                ]}
                                disabled={isViewMode}
                            />
                        </div>
                        <div className="min-w-0">
                            <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Error Message <span className="text-black">*</span>
                            </Label>
                            <Input
                                type="text"
                                value={config.errorMessage || ''}
                                onChange={(e) => handleErrorMessageChange(e.target.value)}
                                placeholder="Enter error message"
                                className="w-full"
                                inputSize="lg"
                                disabled={isViewMode}
                            />
                        </div>
                    </div>
                )}

                {/* When Response Type is Success - show all three fields in one row */}
                {responseType === 'success' && (
                    <>
                        <div className="grid grid-cols-3 gap-4 items-start">
                            <div className="min-w-0">
                                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Response Type <span className="text-black">*</span>
                                </Label>
                                <Select
                                    value={responseType}
                                    onChange={handleResponseTypeChange}
                                    placeholder="Select response type"
                                    className="w-full"
                                    size="large"
                                    options={[
                                        { label: 'Success', value: 'success' },
                                        { label: 'Error', value: 'error' }
                                    ]}
                                    disabled={isViewMode}
                                />
                            </div>
                            <div className="min-w-0">
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
                                    filterOption={(input, option: any) =>
                                        (option?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    popupMatchSelectWidth={true}
                                    listHeight={256}
                                    disabled={isViewMode}
                                />
                            </div>
                            <div className="min-w-0">
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
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="min-w-0">
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
                                        disabled={isViewMode}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
