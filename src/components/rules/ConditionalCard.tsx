import { useState } from 'react';
import { Select, Button, Popover } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { ConfigurationStep, InputParameter } from '../../types/rule-configuration';
import { Input } from '../ui/input';
import RuleConfigurationCard from './RuleConfigurationCard';

interface ConditionalCardProps {
    step: ConfigurationStep;
    inputParameters: InputParameter[];
    stepIndex: number;
    configurationSteps?: ConfigurationStep[];
    onConfigUpdate?: (stepId: string, config: any) => void;
    onAddBranchStep?: (branch: 'true' | 'false') => void;
    onAddOutputToFalse?: () => void;
}

interface Condition {
    id: string;
    sequence: number;
    andOr: 'AND' | 'OR' | 'DO' | null;
    lhs: {
        type: string;
        value: string;
        dataType?: string;
    };
    operator: string;
    rhs: {
        type: string;
        value: string;
        dataType?: string;
    };
}

export default function ConditionalCard({
    step,
    inputParameters,
    stepIndex,
    configurationSteps = [],
    onConfigUpdate,
    onAddBranchStep,
    onAddOutputToFalse
}: ConditionalCardProps) {
    const config = step.config || {
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
    };

    const [conditions, setConditions] = useState<Condition[]>(config.conditions || []);
    const [popoverVisible, setPopoverVisible] = useState<number | null>(null);

    // Get the active branch and expansion state from config
    const activeBranch = config.activeBranch || null;
    const branchExpanded = config.branchExpanded || false;

    // Get branch steps from config
    const trueSteps = config.next?.true || [];
    const falseSteps = config.next?.false || [];

    // Build options for LHS/RHS Type dropdowns
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

    // Operator options
    const operatorOptions = [
        { label: 'Equals', value: 'equals' },
        { label: 'Not Equals', value: 'notEquals' },
        { label: 'Greater Than', value: 'greaterThan' },
        { label: 'Less Than', value: 'lessThan' },
        { label: 'Greater Than or Equal', value: 'greaterThanOrEqual' },
        { label: 'Less Than or Equal', value: 'lessThanOrEqual' },
        { label: 'Contains', value: 'contains' },
        { label: 'Does Not Contain', value: 'doesNotContain' },
        { label: 'Starts With', value: 'startsWith' },
        { label: 'Ends With', value: 'endsWith' }
    ];

    // Data type options for static values
    const dataTypeOptions = [
        { label: 'String', value: 'String' },
        { label: 'Integer', value: 'Integer' },
        { label: 'Float', value: 'Float' },
        { label: 'Boolean', value: 'Boolean' }
    ];

    const handleConditionChange = (index: number, field: string, value: any) => {
        const updatedConditions = [...conditions];
        const keys = field.split('.');

        if (keys.length === 1) {
            updatedConditions[index] = { ...updatedConditions[index], [field]: value };
        } else if (keys.length === 2) {
            updatedConditions[index] = {
                ...updatedConditions[index],
                [keys[0]]: {
                    ...updatedConditions[index][keys[0] as keyof Condition] as any,
                    [keys[1]]: value
                }
            };
        }

        setConditions(updatedConditions);

        if (onConfigUpdate) {
            onConfigUpdate(step.id, {
                ...config,
                conditions: updatedConditions
            });
        }
    };

    const addConditionWithType = (type: 'AND' | 'OR' | 'DO') => {
        const newCondition: Condition = {
            id: Date.now().toString(),
            sequence: conditions.length + 1,
            andOr: type,
            lhs: { type: '', value: '', dataType: 'String' },
            operator: 'equals',
            rhs: { type: '', value: '', dataType: 'String' }
        };

        const updatedConditions = [...conditions, newCondition];
        setConditions(updatedConditions);

        if (onConfigUpdate) {
            onConfigUpdate(step.id, {
                ...config,
                conditions: updatedConditions
            });
        }

        setPopoverVisible(null);
    };

    const removeCondition = (index: number) => {
        if (conditions.length <= 1) return;

        const updatedConditions = conditions.filter((_, i) => i !== index);
        setConditions(updatedConditions);

        if (onConfigUpdate) {
            onConfigUpdate(step.id, {
                ...config,
                conditions: updatedConditions
            });
        }
    };

    // Check if last condition is DO
    const lastConditionIsDo = conditions.length > 0 && conditions[conditions.length - 1].andOr === 'DO';

    // Handler to toggle branch expansion
    const handleToggleBranch = (branch: 'true' | 'false') => {
        if (onConfigUpdate) {
            onConfigUpdate(step.id, {
                ...config,
                activeBranch: activeBranch === branch && branchExpanded ? null : branch,
                branchExpanded: !(activeBranch === branch && branchExpanded)
            });
        }
    };

    // Popover content for condition type selection
    const conditionTypeContent = (
        <div className="flex flex-col gap-2 p-2">
            <Button
                onClick={() => addConditionWithType('OR')}
                className="w-full text-left justify-start"
                type="text"
            >
                OR
            </Button>
            <Button
                onClick={() => addConditionWithType('AND')}
                className="w-full text-left justify-start"
                type="text"
            >
                AND
            </Button>
            <Button
                onClick={() => addConditionWithType('DO')}
                className="w-full text-left justify-start"
                type="text"
            >
                DO
            </Button>
        </div>
    );

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 relative">
                {/* Title Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Conditional If</h3>
                        <span className="px-3 py-1 text-sm font-medium text-purple-600 bg-purple-50 rounded">
                            Conditional
                        </span>
                    </div>
                </div>

                {/* Conditions */}
                <div className="space-y-3 mb-6">
                    {conditions.map((condition, index) => (
                        <div key={condition.id} className="space-y-3">
                            {/* AND/OR/DO Badge (for all except first condition) */}
                            {index > 0 && condition.andOr && (
                                <div className="flex items-center justify-start">
                                    <span className={`px-4 py-1 text-sm font-semibold rounded ${condition.andOr === 'OR' ? 'bg-blue-100 text-blue-700' :
                                        condition.andOr === 'AND' ? 'bg-green-100 text-green-700' :
                                            'bg-purple-100 text-purple-700'
                                        }`}>
                                        {condition.andOr}
                                    </span>
                                </div>
                            )}

                            {/* Condition Row */}
                            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-start py-3 rounded-lg">
                                {/* Left Hand Side (LHS) */}
                                <div className="space-y-2">
                                    <Select
                                        showSearch
                                        value={condition.lhs.type || undefined}
                                        onChange={(value) => {
                                            handleConditionChange(index, 'lhs.type', value);
                                            if (value !== 'Static Value') {
                                                handleConditionChange(index, 'lhs.value', value);
                                            } else {
                                                handleConditionChange(index, 'lhs.value', '');
                                            }
                                        }}
                                        placeholder="Select value"
                                        className="w-full"
                                        size="large"
                                        options={typeOptions}
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        popupMatchSelectWidth={false}
                                        listHeight={256}
                                    />
                                    {condition.lhs.type === 'Static Value' && (
                                        <>
                                            <Select
                                                value={condition.lhs.dataType || 'String'}
                                                onChange={(value) => handleConditionChange(index, 'lhs.dataType', value)}
                                                placeholder="Data type"
                                                className="w-full"
                                                size="large"
                                                options={dataTypeOptions}
                                            />
                                            <Input
                                                value={condition.lhs.value}
                                                onChange={(e) => handleConditionChange(index, 'lhs.value', e.target.value)}
                                                placeholder="Enter value"
                                                className="w-full"
                                                inputSize="lg"
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Operator */}
                                <div>
                                    <Select
                                        showSearch
                                        value={condition.operator}
                                        onChange={(value) => handleConditionChange(index, 'operator', value)}
                                        placeholder="Select operator"
                                        className="w-full"
                                        size="large"
                                        options={operatorOptions}
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        popupMatchSelectWidth={false}
                                        listHeight={256}
                                    />
                                </div>

                                {/* Right Hand Side (RHS) */}
                                <div className="space-y-2">
                                    <Select
                                        showSearch
                                        value={condition.rhs.type || undefined}
                                        onChange={(value) => {
                                            handleConditionChange(index, 'rhs.type', value);
                                            if (value !== 'Static Value') {
                                                handleConditionChange(index, 'rhs.value', value);
                                            } else {
                                                handleConditionChange(index, 'rhs.value', '');
                                            }
                                        }}
                                        placeholder="Select value"
                                        className="w-full"
                                        size="large"
                                        options={typeOptions}
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        popupMatchSelectWidth={false}
                                        listHeight={256}
                                    />
                                    {condition.rhs.type === 'Static Value' && (
                                        <>
                                            <Select
                                                value={condition.rhs.dataType || 'String'}
                                                onChange={(value) => handleConditionChange(index, 'rhs.dataType', value)}
                                                placeholder="Data type"
                                                className="w-full"
                                                size="large"
                                                options={dataTypeOptions}
                                            />
                                            <Input
                                                value={condition.rhs.value}
                                                onChange={(e) => handleConditionChange(index, 'rhs.value', e.target.value)}
                                                placeholder="Enter value"
                                                className="w-full"
                                                inputSize="lg"
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Delete Button */}
                                <div className="flex items-center justify-end">
                                    {conditions.length > 1 && (
                                        <Button
                                            icon={<CloseOutlined />}
                                            onClick={() => removeCondition(index)}
                                            className="flex items-center justify-center w-9 h-9 border-none text-gray-400 transition-colors rounded-full"
                                            type="text"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add Condition Button - Only show if last condition is not DO */}
                    {!lastConditionIsDo && (
                        <div className="flex justify-center">
                            <Popover
                                content={conditionTypeContent}
                                trigger="click"
                                open={popoverVisible === 0}
                                onOpenChange={(visible) => setPopoverVisible(visible ? 0 : null)}
                                placement="bottom"
                            >
                                <Button
                                    icon={<PlusOutlined />}
                                    size="large"
                                    className="px-6"
                                >
                                    Add Condition
                                </Button>
                            </Popover>
                        </div>
                    )}
                </div>
            </div>

            {/* Connector lines OUTSIDE the card - Only show when DO is selected */}
            {lastConditionIsDo && (
                <div className="relative -mt-6">
                    {/* Main vertical connector line from bottom-center of card */}
                    <div className="flex justify-center">
                        <div className="w-px h-16 bg-gray-300"></div>
                    </div>

                    {/* Horizontal and vertical branch connectors */}
                    <div className="relative">
                        <div className="grid grid-cols-2 gap-4 px-2">
                            {/* TRUE Branch (Left) - connects to text */}
                            <div className="flex flex-col items-center">
                                {/* Vertical connector line */}
                                <div className="w-px h-8 bg-gray-300"></div>
                                {/* TRUE button - clickable */}
                                <button
                                    onClick={() => handleToggleBranch('true')}
                                    className={`px-6 py-2 bg-green-100 border-2 border-green-600 rounded-lg hover:bg-green-200 transition-colors ${!(activeBranch === 'true' && branchExpanded) ? 'mb-2' : ''}`}
                                >
                                    <span className="text-green-700 font-bold text-base">TRUE</span>
                                </button>
                                {/* Conditional content based on expansion state */}
                                {!(activeBranch === 'true' && branchExpanded) && (
                                    <>
                                        {/* Vertical connector line */}
                                        <div className="w-px h-6 bg-gray-300"></div>
                                        {/* Output for True - Clickable Text */}
                                        <button
                                            onClick={() => handleToggleBranch('true')}
                                            className="flex items-center gap-2 hover:bg-green-50 transition-colors px-3 py-2 rounded"
                                        >
                                            <span className="text-green-700 font-semibold">Output for True</span>
                                            <span className="text-green-600">▶</span>
                                        </button>
                                    </>
                                )}
                                {/* When expanded, show vertical connector line continuing from button */}
                                {activeBranch === 'true' && branchExpanded && (
                                    <div className="w-px flex-1 bg-gray-300"></div>
                                )}
                            </div>

                            {/* FALSE Branch (Right) - connects to text */}
                            <div className="flex flex-col items-center">
                                {/* Vertical connector line */}
                                <div className="w-px h-8 bg-gray-300"></div>
                                {/* FALSE button - clickable */}
                                <button
                                    onClick={() => handleToggleBranch('false')}
                                    className={`px-6 py-2 bg-red-100 border-2 border-red-600 rounded-lg hover:bg-red-200 transition-colors ${!(activeBranch === 'true' && branchExpanded) ? 'mb-2' : ''}`}
                                >
                                    <span className="text-red-700 font-bold text-base">FALSE</span>
                                </button>
                                {/* Conditional content based on expansion state */}
                                {!(activeBranch === 'false' && branchExpanded) && (
                                    <>
                                        {/* Vertical connector line */}
                                        <div className="w-px h-6 bg-gray-300"></div>
                                        {/* Output for False - Clickable Text */}
                                        <button
                                            onClick={() => handleToggleBranch('false')}
                                            className="flex items-center gap-2 hover:bg-red-50 transition-colors px-3 py-2 rounded"
                                        >
                                            <span className="text-red-700 font-semibold">Output for False</span>
                                            <span className="text-red-600">▶</span>
                                        </button>
                                    </>
                                )}
                                {/* When expanded, add a vertical connector from button to card */}
                                {activeBranch === 'false' && branchExpanded && (
                                    <div className="w-px flex-1 bg-gray-300"></div>
                                )}
                            </div>
                        </div>

                        {/* Horizontal lines connecting to branches */}
                        <div className="absolute top-0 left-0 right-0 px-2">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Left horizontal line */}
                                <div className="flex justify-end">
                                    <div className="w-1/2 h-px bg-gray-300"></div>
                                </div>
                                {/* Right horizontal line */}
                                <div className="flex justify-start">
                                    <div className="w-1/2 h-px bg-gray-300"></div>
                                </div>
                            </div>
                        </div>

                        {/* Center dot - positioned absolutely in the middle */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-400 z-10"></div>
                    </div>

                    {/* Expandable Cards - Show below when expanded */}
                    <div className="grid grid-cols-[1fr_1fr] gap-6 relative">
                        {/* TRUE Branch Card - Takes more width to the right */}
                        {activeBranch === 'true' && branchExpanded && (
                            <>
                                {/* Vertical connector line positioned to align with TRUE button */}
                                <div className="absolute left-1/4 top-0 w-px h-6 bg-gray-300" style={{ transform: 'translateX(-50%)' }}></div>
                                <div className="col-span-2 flex justify-start pl-8 mt-6">
                                    <div className="flex flex-col w-4/5">
                                        <div className="border-2 border-green-500/30 rounded-lg bg-green-50/20 w-full shadow-md shadow-green-100/50">
                                            <div className="p-6 space-y-4">
                                                {/* Render TRUE branch steps */}
                                                {trueSteps.map((trueStep: ConfigurationStep, index: number) => (
                                                    <div key={trueStep.id}>
                                                        <RuleConfigurationCard
                                                            step={trueStep}
                                                            inputParameters={inputParameters}
                                                            stepIndex={stepIndex}
                                                            configurationSteps={configurationSteps}
                                                            onConfigUpdate={(stepId: string, stepConfig: any) => {
                                                                // Update the step in TRUE branch
                                                                const updatedTrueSteps = trueSteps.map((s: ConfigurationStep) =>
                                                                    s.id === stepId ? { ...s, config: stepConfig } : s
                                                                );
                                                                if (onConfigUpdate) {
                                                                    onConfigUpdate(step.id, {
                                                                        ...config,
                                                                        next: {
                                                                            true: updatedTrueSteps,
                                                                            false: falseSteps
                                                                        }
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                        {index < trueSteps.length - 1 && (
                                                            <div className="h-8 w-px bg-gray-300 mx-auto"></div>
                                                        )}
                                                    </div>
                                                ))}

                                                {/* Add Step Button */}
                                                {trueSteps.length > 0 && trueSteps[trueSteps.length - 1].type !== 'output' && (
                                                    <div className="h-8 w-px bg-gray-300 mx-auto"></div>
                                                )}

                                                {(trueSteps.length === 0 || trueSteps[trueSteps.length - 1].type !== 'output') && (
                                                    <div className="text-center">
                                                        <Button
                                                            type="primary"
                                                            onClick={() => onAddBranchStep && onAddBranchStep('true')}
                                                            className="bg-red-500 hover:bg-red-400 focus:bg-red-400 border-none"
                                                            size="large"
                                                        >
                                                            Add Step
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* FALSE Branch Card - Takes more width to the left */}
                        {activeBranch === 'false' && branchExpanded && (
                            <>
                                {/* Vertical connector line positioned to align with FALSE button */}
                                <div className="absolute right-1/4 top-0 w-px h-6 bg-gray-300" style={{ transform: 'translateX(50%)' }}></div>
                                <div className="col-span-2 flex justify-end pr-8 mt-6">
                                    <div className="flex flex-col w-4/5">
                                        <div className="border-2 border-red-500/30 rounded-lg bg-red-50/20 w-full shadow-md shadow-red-100/50">
                                            <div className="p-6 space-y-4">
                                                {/* Render FALSE branch steps (output card) */}
                                                {falseSteps.map((falseStep: ConfigurationStep) => (
                                                    <div key={falseStep.id}>
                                                        <RuleConfigurationCard
                                                            step={falseStep}
                                                            inputParameters={inputParameters}
                                                            stepIndex={stepIndex}
                                                            configurationSteps={configurationSteps}
                                                            onConfigUpdate={(stepId: string, stepConfig: any) => {
                                                                // Update the step in FALSE branch
                                                                const updatedFalseSteps = falseSteps.map((s: ConfigurationStep) =>
                                                                    s.id === stepId ? { ...s, config: stepConfig } : s
                                                                );
                                                                if (onConfigUpdate) {
                                                                    onConfigUpdate(step.id, {
                                                                        ...config,
                                                                        next: {
                                                                            true: trueSteps,
                                                                            false: updatedFalseSteps
                                                                        }
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                ))}

                                                {/* Add Return Card button - Only show if no output card exists */}
                                                {falseSteps.length === 0 && (
                                                    <div className="text-center">
                                                        <Button
                                                            type="primary"
                                                            onClick={() => onAddOutputToFalse && onAddOutputToFalse()}
                                                            className="bg-red-500 hover:bg-red-400 focus:bg-red-400 border-none"
                                                            size="large"
                                                        >
                                                            Add Return Card
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
