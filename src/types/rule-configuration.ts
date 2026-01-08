export interface InputParameter {
    id: string;
    name: string;
    size: string;
    type: string;
}

export type FunctionType = 'find-replace' | 'concatenate' | 'date-format' | 'conditional' | null;

export interface ConfigurationStep {
    id: string;
    type: FunctionType;
    config?: any;
}
