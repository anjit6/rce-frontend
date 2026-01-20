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
    handleAddBranchStep?: (stepId: string, branch: 'true' | 'false') => void;
    isViewMode?: boolean;
    // Step number display props
    stepNumber?: number; // Main step number (e.g., 2 in "Step 2")
    conditionStepNumber?: number; // Sub-step number within condition branch (e.g., 1 in "Step 2 (1)")
    // All configuration steps for validation (includes all steps, not just preceding ones)
    allConfigurationSteps?: ConfigurationStep[];
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
    handleAddBranchStep,
    isViewMode = false,
    stepNumber,
    conditionStepNumber,
    allConfigurationSteps
}: ConditionalCardProps) {
    const defaultCondition = {
        id: '1',
        sequence: 1,
        andOr: null,
        lhs: { type: '', value: '', dataType: 'String' },
        operator: 'equals',
        rhs: { type: '', value: '', dataType: 'String' }
    };

    const config = step.config || {
        conditions: [defaultCondition],
        next: {
            true: [],
            false: []
        }
    };

    // Use step.config.conditions directly to ensure we read from the actual props
    const conditions = (step.config?.conditions && step.config.conditions.length > 0)
        ? step.config.conditions
        : (config.conditions && config.conditions.length > 0)
            ? config.conditions
            : [defaultCondition];
    const [popoverVisible, setPopoverVisible] = useState<number | null>(null);

    // Get branch steps from config
    const trueSteps = config.next?.true || [];
    const falseSteps = config.next?.false || [];

    // Calculate the maximum depth of nested conditionals in a branch
    const calculateMaxDepth = (steps: ConfigurationStep[]): number => {
        if (steps.length === 0) return 0;

        let maxDepth = 0;
        steps.forEach(s => {
            if (s.type === 'conditional') {
                const trueDepth = calculateMaxDepth(s.config?.next?.true || []);
                const falseDepth = calculateMaxDepth(s.config?.next?.false || []);
                maxDepth = Math.max(maxDepth, 1 + Math.max(trueDepth, falseDepth));
            }
        });

        return maxDepth;
    };

    // Calculate dynamic widths based on nesting depth
    const trueDepth = calculateMaxDepth(trueSteps);
    const falseDepth = calculateMaxDepth(falseSteps);
    const maxDepth = Math.max(trueDepth, falseDepth);

    // Base width is 1200px, each level of nesting doubles the width
    const baseWidth = 1200;
    const branchMinWidth = baseWidth * (maxDepth + 1);
    const containerMinWidth = branchMinWidth * 2;

    // Build options for LHS/RHS Type dropdowns
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
        { label: 'Boolean', value: 'Boolean' },
        { label: 'Date', value: 'Date' }
    ];

    const handleConditionChange = (index: number, field: string, value: any) => {
        // Use step.config.conditions directly to ensure we're working with the actual state
        const currentConditions = step.config?.conditions || conditions;
        const updatedConditions = [...currentConditions];
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

        if (onConfigUpdate) {
            onConfigUpdate(step.id, {
                ...step.config,
                conditions: updatedConditions,
                next: step.config?.next || { true: [], false: [] }
            });
        }
    };

    // Handle LHS/RHS type selection - updates type and value atomically
    const handleSideTypeChange = (index: number, side: 'lhs' | 'rhs', typeValue: string) => {
        const currentConditions = step.config?.conditions || conditions;
        const updatedConditions = [...currentConditions];

        updatedConditions[index] = {
            ...updatedConditions[index],
            [side]: {
                ...updatedConditions[index][side],
                type: typeValue,
                value: typeValue === 'Static Value' ? '' : typeValue
            }
        };

        if (onConfigUpdate) {
            onConfigUpdate(step.id, {
                ...step.config,
                conditions: updatedConditions,
                next: step.config?.next || { true: [], false: [] }
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

        const updatedConditions = conditions.filter((_: Condition, i: number) => i !== index);

        if (onConfigUpdate) {
            onConfigUpdate(step.id, {
                ...config,
                conditions: updatedConditions
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
        </div>
    );

    // Generate step number display text for this conditional card
    const displayStepNumber = stepNumber !== undefined ? stepNumber : stepIndex + 1;
    const stepNumberText = conditionStepNumber !== undefined
        ? `Step ${displayStepNumber} (${conditionStepNumber})`
        : `Step ${displayStepNumber}`;

    return (
        <>
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 relative overflow-visible" style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Step Number Badge - Top Right Corner */}
                <div className="absolute top-3 right-3 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                    {stepNumberText}
                </div>

                {/* Title Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2 pr-24">
                        <h3 className="text-lg font-semibold text-gray-900">Conditional If</h3>
                        <span className="px-3 py-1 text-sm font-medium text-purple-600 bg-purple-50 rounded">
                            Conditional
                        </span>
                    </div>
                </div>

                {/* Conditions */}
                <div className="space-y-3 mb-6 overflow-visible">
                    {conditions.map((condition, index) => (
                        <div key={condition.id} className="space-y-3">
                            {/* AND/OR Badge (for all except first condition) */}
                            {index > 0 && condition.andOr && (
                                <div className="flex items-center justify-start">
                                    <span className={`px-4 py-1 text-sm font-semibold rounded ${condition.andOr === 'OR' ? 'bg-blue-100 text-blue-700' :
                                        'bg-green-100 text-green-700'
                                        }`}>
                                        {condition.andOr}
                                    </span>
                                </div>
                            )}

                            {/* Condition Row */}
                            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-start py-3 rounded-lg overflow-visible">
                                {/* Left Hand Side (LHS) */}
                                <div className="space-y-2 overflow-visible min-w-0">
                                    <Select
                                        showSearch
                                        value={condition.lhs.type || undefined}
                                        onChange={(value) => handleSideTypeChange(index, 'lhs', value)}
                                        placeholder="Select value"
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
                                    {condition.lhs.type === 'Static Value' && (
                                        <>
                                            <Select
                                                value={condition.lhs.dataType || 'String'}
                                                onChange={(value) => handleConditionChange(index, 'lhs.dataType', value)}
                                                placeholder="Data type"
                                                className="w-full"
                                                size="large"
                                                options={dataTypeOptions}
                                                disabled={isViewMode}
                                            />
                                            <Input
                                                type={condition.lhs.dataType === 'Date' ? 'date' : (condition.lhs.dataType === 'Integer' || condition.lhs.dataType === 'Float') ? 'number' : 'text'}
                                                value={condition.lhs.value}
                                                onChange={(e) => handleConditionChange(index, 'lhs.value', e.target.value)}
                                                placeholder="Enter value"
                                                className="w-full"
                                                inputSize="lg"
                                                disabled={isViewMode}
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Operator */}
                                <div className="min-w-0">
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
                                        popupMatchSelectWidth={true}
                                        listHeight={256}
                                        disabled={isViewMode}
                                    />
                                </div>

                                {/* Right Hand Side (RHS) */}
                                <div className="space-y-2 overflow-visible min-w-0">
                                    <Select
                                        showSearch
                                        value={condition.rhs.type || undefined}
                                        onChange={(value) => handleSideTypeChange(index, 'rhs', value)}
                                        placeholder="Select value"
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
                                    {condition.rhs.type === 'Static Value' && (
                                        <>
                                            <Select
                                                value={condition.rhs.dataType || 'String'}
                                                onChange={(value) => handleConditionChange(index, 'rhs.dataType', value)}
                                                placeholder="Data type"
                                                className="w-full"
                                                size="large"
                                                options={dataTypeOptions}
                                                disabled={isViewMode}
                                            />
                                            <Input
                                                type={condition.rhs.dataType === 'Date' ? 'date' : (condition.rhs.dataType === 'Integer' || condition.rhs.dataType === 'Float') ? 'number' : 'text'}
                                                value={condition.rhs.value}
                                                onChange={(e) => handleConditionChange(index, 'rhs.value', e.target.value)}
                                                placeholder="Enter value"
                                                className="w-full"
                                                inputSize="lg"
                                                disabled={isViewMode}
                                            />
                                        </>
                                    )}
                                </div>

                                {/* Delete Button */}
                                <div className="flex items-center justify-end">
                                    {conditions.length > 1 && !isViewMode && (
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

                    {/* Add Condition Button */}
                    {!isViewMode && (
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

            {/* Connector lines and Branch Tree - Always show */}
            <div className="relative z-0 overflow-x-auto">
                <div className="min-w-max">
                    {/* Main vertical connector line from bottom-center of card */}
                    <div className="flex justify-center">
                        <div className="w-px h-16 bg-gray-300"></div>
                    </div>

                    {/* Branch Tree Container */}
                    <div className="relative overflow-visible">
                        {/* Horizontal and vertical branch connectors */}
                        <div className="relative">
                            {/* Use flex with same gap as cards to ensure alignment */}
                            <div className="flex gap-6 px-16 items-start">
                                {/* TRUE Branch Connector (Left) - Explicitly set minWidth to match card column */}
                                <div className="flex-1 flex flex-col items-center relative" style={{ minWidth: `${branchMinWidth}px` }}>
                                    {/* Horizontal Line Segment (Right half + half gap) pointing Inwards from RIGHT edge */}
                                    <div className="absolute top-0 right-0 h-px bg-gray-300 z-0" style={{ width: 'calc(50% + 0px)' }}></div> {/* width = 50% of this container + half the gap (12px) */}

                                    {/* Vertical connector line */}
                                    <div className="w-px h-8 bg-gray-300 z-10 relative"></div>
                                    {/* TRUE button */}
                                    <div className="px-6 py-2 bg-gray-100 border-2 border-gray-400 rounded-lg z-10 relative bg-white">
                                        <span className="text-gray-700 font-bold text-base">TRUE</span>
                                    </div>
                                    {/* Vertical connector line continuing from button */}
                                    <div className="w-px h-6 bg-gray-300"></div>
                                </div>

                                {/* FALSE Branch Connector (Right) - Explicitly set minWidth */}
                                <div className="flex-1 flex flex-col items-center relative" style={{ minWidth: `${branchMinWidth}px` }}>
                                    {/* Horizontal Line Segment (Left half + half gap) pointing Inwards from LEFT edge */}
                                    <div className="absolute top-0 left-0 h-px bg-gray-300 z-0" style={{ width: 'calc(50% + 0px)' }}></div>

                                    {/* Vertical connector line */}
                                    <div className="w-px h-8 bg-gray-300 z-10 relative"></div>
                                    {/* FALSE button */}
                                    <div className="px-6 py-2 bg-gray-100 border-2 border-gray-400 rounded-lg z-10 relative bg-white">
                                        <span className="text-gray-700 font-bold text-base">FALSE</span>
                                    </div>
                                    {/* Vertical connector line continuing from button */}
                                    <div className="w-px h-6 bg-gray-300"></div>
                                </div>
                            </div>

                            {/* Center dot - positioned absolutely in the middle */}
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-400 z-20"></div>
                        </div>

                        {/* Branch Cards - Both visible side by side */}
                        <div className="flex gap-6 mt-0 px-16 items-start" style={{ minWidth: `${containerMinWidth}px` }}> {/* items-start to ensure top alignment */}
                            {/* TRUE Branch Card */}
                            <div className="flex flex-col flex-1" style={{ minWidth: `${branchMinWidth}px` }}>
                                <div className="flex flex-col w-full"> {/* Centering content */}
                                    {/* Render TRUE branch steps */}
                                    {trueSteps.map((trueStep: ConfigurationStep, index: number) => {
                                        // Combine parent steps (before conditional) with previous branch steps
                                        const combinedSteps = [
                                            ...configurationSteps.slice(0, stepIndex),
                                            ...trueSteps.slice(0, index)
                                        ];
                                        return (
                                            <div key={trueStep.id} className="w-full flex flex-col items-center">
                                                <RuleConfigurationCard
                                                    step={trueStep}
                                                    inputParameters={inputParameters}
                                                    stepIndex={combinedSteps.length}
                                                    configurationSteps={combinedSteps}
                                                    stepNumber={displayStepNumber}
                                                    conditionStepNumber={index + 1}
                                                    allConfigurationSteps={allConfigurationSteps}
                                                    onConfigUpdate={(stepId: string, stepConfig: any) => {
                                                        // Update the step in TRUE branch - need to recursively update
                                                        const updateStepRecursively = (steps: ConfigurationStep[]): ConfigurationStep[] => {
                                                            return steps.map((s: ConfigurationStep) => {
                                                                if (s.id === stepId) {
                                                                    return { ...s, config: stepConfig };
                                                                } else if (s.type === 'conditional' && s.config?.next) {
                                                                    // Recursively update nested conditionals
                                                                    const updatedTrue = updateStepRecursively(s.config.next.true || []);
                                                                    const updatedFalse = updateStepRecursively(s.config.next.false || []);
                                                                    if (updatedTrue !== s.config.next.true || updatedFalse !== s.config.next.false) {
                                                                        return {
                                                                            ...s,
                                                                            config: {
                                                                                ...s.config,
                                                                                next: {
                                                                                    true: updatedTrue,
                                                                                    false: updatedFalse
                                                                                }
                                                                            }
                                                                        };
                                                                    }
                                                                }
                                                                return s;
                                                            });
                                                        };

                                                        const updatedTrueSteps = updateStepRecursively(trueSteps);
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
                                                    onAddBranchStep={
                                                        // If handleAddBranchStep is available and this is a nested conditional,
                                                        // create a new callback that binds to the NESTED step's ID
                                                        trueStep.type === 'conditional' && handleAddBranchStep
                                                            ? (branch) => handleAddBranchStep(trueStep.id, branch)
                                                            : onAddBranchStep
                                                    }
                                                    isViewMode={isViewMode}
                                                />
                                                {index < trueSteps.length - 1 && (
                                                    <div className="h-10 w-px bg-gray-300 mx-auto -mt-8"></div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Add Step Button */}
                                    {trueSteps.length > 0 && trueSteps[trueSteps.length - 1].type !== 'output' && trueSteps[trueSteps.length - 1].type !== 'conditional' && (
                                        <div className="h-10 w-px bg-gray-300 mx-auto -mt-6"></div>
                                    )}

                                    {!isViewMode && (trueSteps.length === 0 || (trueSteps[trueSteps.length - 1].type !== 'output' && trueSteps[trueSteps.length - 1].type !== 'conditional')) && (
                                        <div className="text-center w-full flex justify-center">
                                            <Button
                                                type="primary"
                                                onClick={() => {
                                                    // For nested conditionals, we need to handle adding steps to the branch
                                                    if (onAddBranchStep) {
                                                        onAddBranchStep('true');
                                                    }
                                                }}
                                                className="bg-red-500 hover:bg-red-400 focus:bg-red-400 border-none px-8"
                                                size="large"
                                            >
                                                Add Step
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* FALSE Branch Card */}
                            <div className="flex flex-col flex-1" style={{ minWidth: `${branchMinWidth}px` }}>
                                <div className="flex flex-col items-center w-full">
                                    {/* Render FALSE branch steps (output card) */}
                                    {falseSteps.map((falseStep: ConfigurationStep, index: number) => {
                                        // Combine parent steps (before conditional) with previous branch steps
                                        const combinedSteps = [
                                            ...configurationSteps.slice(0, stepIndex),
                                            ...falseSteps.slice(0, index)
                                        ];
                                        return (
                                            <div key={falseStep.id} className="w-full flex flex-col items-center">
                                                <RuleConfigurationCard
                                                    step={falseStep}
                                                    inputParameters={inputParameters}
                                                    stepIndex={combinedSteps.length}
                                                    configurationSteps={combinedSteps}
                                                    stepNumber={displayStepNumber}
                                                    conditionStepNumber={index + 1}
                                                    allConfigurationSteps={allConfigurationSteps}
                                                    onConfigUpdate={(stepId: string, stepConfig: any) => {
                                                        // Update the step in FALSE branch - need to recursively update
                                                        const updateStepRecursively = (steps: ConfigurationStep[]): ConfigurationStep[] => {
                                                            return steps.map((s: ConfigurationStep) => {
                                                                if (s.id === stepId) {
                                                                    return { ...s, config: stepConfig };
                                                                } else if (s.type === 'conditional' && s.config?.next) {
                                                                    // Recursively update nested conditionals
                                                                    const updatedTrue = updateStepRecursively(s.config.next.true || []);
                                                                    const updatedFalse = updateStepRecursively(s.config.next.false || []);
                                                                    if (updatedTrue !== s.config.next.true || updatedFalse !== s.config.next.false) {
                                                                        return {
                                                                            ...s,
                                                                            config: {
                                                                                ...s.config,
                                                                                next: {
                                                                                    true: updatedTrue,
                                                                                    false: updatedFalse
                                                                                }
                                                                            }
                                                                        };
                                                                    }
                                                                }
                                                                return s;
                                                            });
                                                        };

                                                        const updatedFalseSteps = updateStepRecursively(falseSteps);
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
                                                    onAddBranchStep={
                                                        // If handleAddBranchStep is available and this is a nested conditional,
                                                        // create a new callback that binds to the NESTED step's ID
                                                        falseStep.type === 'conditional' && handleAddBranchStep
                                                            ? (branch) => handleAddBranchStep(falseStep.id, branch)
                                                            : onAddBranchStep
                                                    }
                                                    isViewMode={isViewMode}
                                                />
                                                {index < falseSteps.length - 1 && (
                                                    <div className="h-10 w-px bg-gray-300 mx-auto -mt-8"></div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Add Step Button for FALSE branch */}
                                    {falseSteps.length > 0 && falseSteps[falseSteps.length - 1].type !== 'output' && falseSteps[falseSteps.length - 1].type !== 'conditional' && (
                                        <div className="h-10 w-px bg-gray-300 mx-auto -mt-6"></div>
                                    )}

                                    {!isViewMode && (falseSteps.length === 0 || (falseSteps[falseSteps.length - 1].type !== 'output' && falseSteps[falseSteps.length - 1].type !== 'conditional')) && (
                                        <div className="text-center w-full flex justify-center">
                                            <Button
                                                type="primary"
                                                onClick={() => onAddBranchStep && onAddBranchStep('false')}
                                                className="bg-red-500 hover:bg-red-400 focus:bg-red-400 border-none px-8"
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
                </div>
            </div >
        </>
    );
}
