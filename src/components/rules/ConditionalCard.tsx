import { useState } from 'react';
import { Select, Button, Popover } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { ConfigurationStep, InputParameter } from '../../types/rule-configuration';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import RuleConfigurationCard from './RuleConfigurationCard';
import { formatStepId } from '../../utils/stepIdGenerator';

interface ConditionalCardProps {
    step: ConfigurationStep;
    inputParameters: InputParameter[];
    stepIndex: number;
    configurationSteps?: ConfigurationStep[];
    onConfigUpdate?: (stepId: string, config: any) => void;
    onAddBranchStep?: (branch: 'true' | 'false') => void;
    handleAddBranchStep?: (stepId: string, branch: 'true' | 'false') => void;
    handleDeleteBranchStep?: (parentStepId: string, stepIdToDelete: string, branch: 'true' | 'false') => void;
    handleDeleteMainFlowStep?: (stepId: string) => void;
    isViewMode?: boolean;
    // All configuration steps for validation (includes all steps, not just preceding ones)
    allConfigurationSteps?: ConfigurationStep[];
    // Flag to indicate if this card can be deleted (is last and leaf node)
    canDelete?: boolean;
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
    handleDeleteBranchStep,
    handleDeleteMainFlowStep,
    isViewMode = false,
    allConfigurationSteps,
    canDelete = false
}: ConditionalCardProps) {
    const defaultCondition = {
        id: '1',
        sequence: 1,
        andOr: null,
        lhs: { type: '', value: '', dataType: 'String' },
        operator: '',
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

    // Calculate the total width needed for a branch based on its content
    const calculateBranchWidth = (steps: ConfigurationStep[]): number => {
        if (steps.length === 0) return 300; // Empty branch minimal width

        // Check if this branch ONLY has a conditional and nothing else
        if (steps.length === 1 && steps[0].type === 'conditional') {
            const conditionalStep = steps[0];
            if (conditionalStep.config?.next) {
                // For a branch with ONLY a conditional, calculate nested widths
                const trueWidth = calculateBranchWidth(conditionalStep.config.next.true || []);
                const falseWidth = calculateBranchWidth(conditionalStep.config.next.false || []);
                // Return just the nested width (no extra base width)
                return trueWidth + falseWidth + 24;
            }
        }

        // For branches with actual steps (subfunction, output, or multiple steps)
        let maxWidth = 800; // Base width for a branch with actual steps

        steps.forEach(s => {
            if (s.type === 'conditional' && s.config?.next) {
                // For nested conditionals, calculate width of both sub-branches
                const trueWidth = calculateBranchWidth(s.config.next.true || []);
                const falseWidth = calculateBranchWidth(s.config.next.false || []);
                // This branch needs to fit both sub-branches side by side plus gap
                const nestedWidth = trueWidth + falseWidth + 24;
                maxWidth = Math.max(maxWidth, nestedWidth);
            }
        });

        return maxWidth;
    };

    // Calculate width independently for each branch based on its actual content
    const trueBranchMinWidth = calculateBranchWidth(trueSteps);
    const falseBranchMinWidth = calculateBranchWidth(falseSteps);

    // Build base options (without Static Value)
    const baseTypeOptions = [
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
            }))
    ];

    // LHS options (without Static Value)
    const typeOptionsLHS = baseTypeOptions;

    // RHS options (with Static Value)
    const typeOptionsRHS = [
        ...baseTypeOptions,
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
            operator: '',
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

    // Generate step number display text using hierarchical step ID
    const stepNumberText = formatStepId(step.stepId);

    return (
        <>
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 relative overflow-visible" style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Delete button for leaf conditional in main flow */}
                {!isViewMode && canDelete && handleDeleteMainFlowStep && (
                    <Button
                        icon={<CloseOutlined />}
                        onClick={() => handleDeleteMainFlowStep(step.id)}
                        className="absolute top-3 right-3 z-20 bg-gray-100 hover:bg-red-100 hover:text-red-600 border-none shadow-sm rounded-full"
                        type="text"
                        size="small"
                    />
                )}

                {/* Step Number Badge and Category - Top Right Corner */}
                <div className="absolute top-3 right-12 flex flex-row items-center gap-2">
                    <div className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                        {stepNumberText}
                    </div>
                    <div className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                        Conditional
                    </div>
                </div>

                {/* Title Section */}
                <div className="mb-6 pr-24">
                    <h3 className="text-lg font-semibold text-gray-900">Conditional If</h3>
                </div>

                {/* Conditions */}
                <div className="space-y-3 mb-6 overflow-visible">
                    {conditions.map((condition: Condition, index: number) => (
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
                                    <Label className="text-sm font-medium text-gray-900">Type </Label>
                                    <Select
                                        showSearch
                                        value={condition.lhs.type || undefined}
                                        onChange={(value) => handleSideTypeChange(index, 'lhs', value)}
                                        placeholder="Select Input"
                                        className="w-full"
                                        size="large"
                                        options={typeOptionsLHS}
                                        filterOption={(input, option: any) =>
                                            (option?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        popupMatchSelectWidth={true}
                                        listHeight={256}
                                        disabled={isViewMode}
                                    />
                                    {condition.lhs.type === 'Static Value' && (
                                        <>
                                            <Label className="text-sm font-medium text-gray-900">Data Type </Label>
                                            <Select
                                                value={condition.lhs.dataType || 'String'}
                                                onChange={(value) => handleConditionChange(index, 'lhs.dataType', value)}
                                                placeholder="Data type"
                                                className="w-full"
                                                size="large"
                                                options={dataTypeOptions}
                                                disabled={isViewMode}
                                            />
                                            <Label className="text-sm font-medium text-gray-900">Value </Label>
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
                                <div className="space-y-2 min-w-0">
                                    <Label className="text-sm font-medium text-gray-900">Operator </Label>
                                    <Select
                                        showSearch
                                        value={undefined}
                                        onChange={(value) => handleConditionChange(index, 'operator', value)}
                                        placeholder="Select Condition"
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
                                    <Label className="text-sm font-medium text-gray-900">Type </Label>
                                    <Select
                                        showSearch
                                        value={condition.rhs.type || undefined}
                                        onChange={(value) => handleSideTypeChange(index, 'rhs', value)}
                                        placeholder="Select Value"
                                        className="w-full"
                                        size="large"
                                        options={typeOptionsRHS}
                                        filterOption={(input, option: any) =>
                                            (option?.searchLabel ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        popupMatchSelectWidth={true}
                                        listHeight={256}
                                        disabled={isViewMode}
                                    />
                                    {condition.rhs.type === 'Static Value' && (
                                        <>
                                            <Label className="text-sm font-medium text-gray-900">Data Type </Label>
                                            <Select
                                                value={condition.rhs.dataType || 'String'}
                                                onChange={(value) => handleConditionChange(index, 'rhs.dataType', value)}
                                                placeholder="Data type"
                                                className="w-full"
                                                size="large"
                                                options={dataTypeOptions}
                                                disabled={isViewMode}
                                            />
                                            <Label className="text-sm font-medium text-gray-900">Value </Label>
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
                                    className="border-red-400 text-red-500 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 hover:shadow-lg focus:border-red-400 focus:text-red-500 px-6 transition-all"
                                >
                                    Add Condition
                                </Button>
                            </Popover>
                        </div>
                    )}
                </div>
            </div>

            {/* Connector lines and Branch Tree - Always show */}
            <div className="relative z-0 overflow-x-auto bg-gray-50">
                <div className="min-w-max bg-gray-50">
                    {/* Main vertical connector line from bottom-center of card */}
                    <div className="flex justify-center">
                        <div className="w-px h-16 bg-gray-300"></div>
                    </div>

                    {/* Branch Tree Container */}
                    <div className="relative overflow-visible bg-gray-50">
                        {/* Horizontal and vertical branch connectors */}
                        <div className="relative bg-gray-50">
                            {/* Use flex with same gap as cards to ensure alignment */}
                            <div className="flex gap-6 items-start justify-center bg-gray-50">
                                {/* TRUE Branch Connector (Left) */}
                                <div className="flex flex-col items-center relative bg-gray-50" style={{ minWidth: `${trueBranchMinWidth}px`, width: `${trueBranchMinWidth}px` }}>
                                    {/* Horizontal line segment from center to right edge */}
                                    <div className="absolute top-0 left-1/2 h-px bg-gray-300 z-0" style={{ width: `calc(50% + 12px)` }}></div>

                                    {/* Vertical connector line */}
                                    <div className="w-px h-8 bg-gray-300 z-10 relative"></div>
                                    {/* TRUE label */}
                                    <div className="px-6 py-2 z-10 relative">
                                        <span className="text-gray-700 font-bold text-base">TRUE</span>
                                    </div>
                                    {/* Vertical connector line continuing from label */}
                                    <div className="w-px h-6 bg-gray-300"></div>
                                </div>

                                {/* FALSE Branch Connector (Right) */}
                                <div className="flex flex-col items-center relative bg-gray-50" style={{ minWidth: `${falseBranchMinWidth}px`, width: `${falseBranchMinWidth}px` }}>
                                    {/* Horizontal line segment from left edge to center */}
                                    <div className="absolute top-0 right-1/2 h-px bg-gray-300 z-0" style={{ width: `calc(50% + 12px)` }}></div>

                                    {/* Vertical connector line */}
                                    <div className="w-px h-8 bg-gray-300 z-10 relative"></div>
                                    {/* FALSE label */}
                                    <div className="px-6 py-2 z-10 relative">
                                        <span className="text-gray-700 font-bold text-base">FALSE</span>
                                    </div>
                                    {/* Vertical connector line continuing from label */}
                                    <div className="w-px h-6 bg-gray-300"></div>
                                </div>
                            </div>

                            {/* Center dot - positioned absolutely in the middle */}
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-400 z-20"></div>
                        </div>

                        {/* Branch Cards - Both visible side by side */}
                        <div className="flex gap-6 mt-0 items-start justify-center bg-gray-50"> {/* items-start to ensure top alignment */}
                            {/* TRUE Branch Card */}
                            <div className="flex flex-col bg-gray-50" style={{ minWidth: `${trueBranchMinWidth}px`, width: `${trueBranchMinWidth}px` }}>
                                <div className="flex flex-col w-full items-center bg-gray-50"> {/* Centering content */}
                                    {/* Render TRUE branch steps */}
                                    {trueSteps.map((trueStep: ConfigurationStep, index: number) => {
                                        // Combine parent steps (before conditional) with previous branch steps
                                        const combinedSteps = [
                                            ...configurationSteps.slice(0, stepIndex),
                                            ...trueSteps.slice(0, index)
                                        ];
                                        return (
                                            <div key={trueStep.id} id={`step-${trueStep.id}`} className="w-full flex flex-col items-center relative">
                                                {/* Delete button for leaf node - only show on last card if it's a leaf node */}
                                                {!isViewMode && handleDeleteBranchStep && index === trueSteps.length - 1 && isLeafNode(trueStep) && (
                                                    <Button
                                                        icon={<CloseOutlined />}
                                                        onClick={() => handleDeleteBranchStep(step.id, trueStep.id, 'true')}
                                                        className="absolute top-3 right-3 z-20 bg-gray-100 hover:bg-red-100 hover:text-red-600 border-none shadow-sm rounded-full"
                                                        type="text"
                                                        size="small"
                                                    />
                                                )}
                                                <RuleConfigurationCard
                                                    step={trueStep}
                                                    inputParameters={inputParameters}
                                                    stepIndex={combinedSteps.length}
                                                    configurationSteps={combinedSteps}
                                                    allConfigurationSteps={allConfigurationSteps}
                                                    handleAddBranchStep={handleAddBranchStep}
                                                    handleDeleteBranchStep={handleDeleteBranchStep}
                                                    handleDeleteMainFlowStep={handleDeleteMainFlowStep}
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

                                    {/* Add Step Button with connector line */}
                                    {!isViewMode && (trueSteps.length === 0 || (trueSteps[trueSteps.length - 1].type !== 'output' && trueSteps[trueSteps.length - 1].type !== 'conditional')) && (
                                        <div className="text-center w-full flex flex-col items-center pb-8">
                                            {/* Connector line to button */}
                                            {trueSteps.length > 0 ? (
                                                <>
                                                    <div className="h-10 w-px bg-gray-300 mx-auto -mt-6"></div>
                                                    <div className="w-px bg-gray-300 mx-auto" style={{ height: '16px' }}></div>
                                                </>
                                            ) : (
                                                <div className="w-px bg-gray-300 mx-auto" style={{ height: '16px' }}></div>
                                            )}
                                            <Button
                                                onClick={() => {
                                                    // For nested conditionals, we need to handle adding steps to the branch
                                                    if (onAddBranchStep) {
                                                        onAddBranchStep('true');
                                                    }
                                                }}
                                                className="border-red-400 text-red-500 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 hover:shadow-lg focus:border-red-400 focus:text-red-500 px-8 shadow-md transition-all"
                                                size="large"
                                            >
                                                Add Step
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* FALSE Branch Card */}
                            <div className="flex flex-col bg-gray-50" style={{ minWidth: `${falseBranchMinWidth}px`, width: `${falseBranchMinWidth}px` }}>
                                <div className="flex flex-col items-center w-full bg-gray-50">
                                    {/* Render FALSE branch steps (output card) */}
                                    {falseSteps.map((falseStep: ConfigurationStep, index: number) => {
                                        // Combine parent steps (before conditional) with previous branch steps
                                        const combinedSteps = [
                                            ...configurationSteps.slice(0, stepIndex),
                                            ...falseSteps.slice(0, index)
                                        ];
                                        return (
                                            <div key={falseStep.id} id={`step-${falseStep.id}`} className="w-full flex flex-col items-center relative">
                                                {/* Delete button for leaf node - only show on last card if it's a leaf node */}
                                                {!isViewMode && handleDeleteBranchStep && index === falseSteps.length - 1 && isLeafNode(falseStep) && (
                                                    <Button
                                                        icon={<CloseOutlined />}
                                                        onClick={() => handleDeleteBranchStep(step.id, falseStep.id, 'false')}
                                                        className="absolute top-3 right-3 z-20 bg-gray-100 hover:bg-red-100 hover:text-red-600 border-none shadow-sm rounded-full"
                                                        type="text"
                                                        size="small"
                                                    />
                                                )}
                                                <RuleConfigurationCard
                                                    step={falseStep}
                                                    inputParameters={inputParameters}
                                                    stepIndex={combinedSteps.length}
                                                    configurationSteps={combinedSteps}
                                                    allConfigurationSteps={allConfigurationSteps}
                                                    handleAddBranchStep={handleAddBranchStep}
                                                    handleDeleteBranchStep={handleDeleteBranchStep}
                                                    handleDeleteMainFlowStep={handleDeleteMainFlowStep}
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

                                    {/* Add Step Button for FALSE branch with connector line */}
                                    {!isViewMode && (falseSteps.length === 0 || (falseSteps[falseSteps.length - 1].type !== 'output' && falseSteps[falseSteps.length - 1].type !== 'conditional')) && (
                                        <div className="text-center w-full flex flex-col items-center pb-8">
                                            {/* Connector line to button */}
                                            {falseSteps.length > 0 ? (
                                                <>
                                                    <div className="h-10 w-px bg-gray-300 mx-auto -mt-6"></div>
                                                    <div className="w-px bg-gray-300 mx-auto" style={{ height: '16px' }}></div>
                                                </>
                                            ) : (
                                                <div className="w-px bg-gray-300 mx-auto" style={{ height: '16px' }}></div>
                                            )}
                                            <Button
                                                onClick={() => onAddBranchStep && onAddBranchStep('false')}
                                                className="border-red-400 text-red-500 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 hover:shadow-lg focus:border-red-400 focus:text-red-500 px-8 shadow-md transition-all"
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
