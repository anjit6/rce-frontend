import { Button, Input, Select, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { ConfigurationStep, InputParameter } from '../../types/rule-configuration';

interface RuleConfigurationCardProps {
    step: ConfigurationStep;
    inputParameters: InputParameter[];
    onDelete?: () => void;
}

export default function RuleConfigurationCard({ step, inputParameters }: RuleConfigurationCardProps) {
    if (!step.type) return null;

    switch (step.type) {
        case 'find-replace':
            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 relative">
                    <h3 className="text-base font-medium text-gray-900 mb-4">String Function - Find & Replace</h3>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-base font-normal text-gray-900">Find and Replace</span>
                        <Tooltip title="Find and Replace">
                            <InfoCircleOutlined className="text-gray-400 cursor-help" />
                        </Tooltip>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Select
                            placeholder="Search In"
                            size="large"
                            options={[
                                ...inputParameters.map(param => ({ value: param.name, label: param.name })),
                                { value: 'Static Text', label: 'Static Text' }
                            ]}
                        />
                        <Select placeholder="Search For" size="large" />
                        <Select placeholder="Replace With" size="large" />
                    </div>
                </div>
            );

        case 'concatenate':
            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-base font-medium text-gray-900 mb-4">String Function - Concatenate</h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <Select placeholder="Input Parameter 1" size="large" />
                        <Select placeholder="Input Parameter 2" size="large" />
                        <Select placeholder="Static Text" size="large" />
                    </div>
                    <Input placeholder="Enter Text" size="large" className="mb-4" />
                </div>
            );

        case 'date-format':
            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-base font-medium text-gray-900 mb-4">Date Format</h3>
                    <div className="space-y-4">
                        <Select placeholder="Select Date Input" size="large" className="w-full" />
                        <Select placeholder="Select Format (DD/MM/YYYY)" size="large" className="w-full" />
                    </div>
                </div>
            );

        case 'conditional':
            return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-base font-medium text-gray-900 mb-4">Conditional - IF</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <Select placeholder="Variable" size="large" />
                            <Select placeholder="Equals" size="large" />
                            <Select placeholder="Static Text" size="large" />
                        </div>
                        <Input placeholder="Enter Value" size="large" />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">TRUE</label>
                                <Select placeholder="Select" size="large" className="w-full" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">FALSE</label>
                                <Select placeholder="Select" size="large" className="w-full" />
                            </div>
                        </div>
                    </div>
                </div>
            );

        default:
            return null;
    }
}
