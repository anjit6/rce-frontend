import { ConfigurationStep } from '../types/rule-configuration';

/**
 * Generates a hierarchical step ID for a step
 * @param parentStepId - The parent step's hierarchical ID (e.g., "1", "1(1)")
 * @param indexInBranch - The index of this step within its branch (0-based)
 * @returns The hierarchical step ID (e.g., "1(1)", "1(1)(1)")
 */
export function generateStepId(parentStepId: string | undefined, indexInBranch: number): string {
    if (!parentStepId) {
        // Top-level step
        return `${indexInBranch + 1}`;
    }
    // Nested step - use parentheses format
    return `${parentStepId}(${indexInBranch + 1})`;
}

/**
 * Recursively assigns step IDs to all configuration steps
 * @param steps - Array of configuration steps
 * @param parentStepId - Optional parent step ID for nested steps
 * @param sharedCounter - Shared counter object for sequential numbering within entire branch tree
 * @returns Array of steps with assigned stepIds
 */
export function assignStepIds(
    steps: ConfigurationStep[],
    parentStepId?: string,
    sharedCounter?: { value: number }
): ConfigurationStep[] {
    return steps.map((step, index) => {
        // If we have a shared counter (nested branches), use it; otherwise use the index
        const stepIndex = sharedCounter ? sharedCounter.value++ : index;
        const stepId = generateStepId(parentStepId, stepIndex);

        const updatedStep = { ...step, stepId };

        // If this is a conditional step, recursively assign IDs to branch steps
        if (step.type === 'conditional' && step.config?.next) {
            const trueSteps = step.config.next.true || [];
            const falseSteps = step.config.next.false || [];

            if (sharedCounter) {
                // We're in a nested branch - continue using the SAME parent ID and counter
                // Store the current counter value for both branches to start from
                const branchStartCounter = sharedCounter.value;

                // Process TRUE branch
                const trueMaxCounter = { value: branchStartCounter };
                const processedTrueSteps = assignStepIds(trueSteps, parentStepId, trueMaxCounter);

                // Process FALSE branch (starts from same counter value)
                const falseMaxCounter = { value: branchStartCounter };
                const processedFalseSteps = assignStepIds(falseSteps, parentStepId, falseMaxCounter);

                // Update the parent counter to the maximum used in either branch
                sharedCounter.value = Math.max(trueMaxCounter.value, falseMaxCounter.value);

                updatedStep.config = {
                    ...step.config,
                    next: {
                        true: processedTrueSteps,
                        false: processedFalseSteps
                    }
                };
            } else {
                // Top-level conditional - create new counters for each branch
                // Each branch starts numbering from (1)
                updatedStep.config = {
                    ...step.config,
                    next: {
                        true: assignStepIds(trueSteps, stepId, { value: 0 }),
                        false: assignStepIds(falseSteps, stepId, { value: 0 })
                    }
                };
            }
        }

        return updatedStep;
    });
}

/**
 * Formats a step ID for display
 * @param stepId - The hierarchical step ID (e.g., "1", "1(1)", "1(1)(1)")
 * @returns Formatted display string (e.g., "Step 1", "Step 1(1)", "Step 1(1)(1)")
 */
export function formatStepId(stepId: string | undefined): string {
    if (!stepId) {
        return 'Step';
    }
    return `Step ${stepId}`;
}
