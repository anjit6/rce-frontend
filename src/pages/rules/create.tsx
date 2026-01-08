import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Select, Collapse, Modal } from 'antd';
import { PlusOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import Layout from '../../components/layout/Layout';
import { getRuleById } from '../../data/rules';
import { InputParameter, FunctionType, ConfigurationStep } from '../../types/rule-configuration';
import RuleConfigurationCard from '../../components/rules/RuleConfigurationCard';

const { Panel } = Collapse;

export default function RuleCreatePage() {
    const { ruleId } = useParams<{ ruleId: string }>();
    const navigate = useNavigate();
    const [rule, setRule] = useState<any>(null);
    const [configurationStarted, setConfigurationStarted] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [configurationSteps, setConfigurationSteps] = useState<ConfigurationStep[]>([]);
    const [inputParameters, setInputParameters] = useState<InputParameter[]>([
        { id: '1', name: 'Input Parameter 1', size: '', type: 'String' },
        { id: '2', name: 'Input Parameter 2', size: '', type: 'String' }
    ]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (ruleId) {
            const ruleData = getRuleById(ruleId);
            if (ruleData) {
                setRule(ruleData);
                document.title = `${ruleData.name} - RCE`;
            } else {
                navigate('/rules');
            }
        }
    }, [ruleId, navigate]);

    const addInputParameter = () => {
        const newParam: InputParameter = {
            id: Date.now().toString(),
            name: `Input Parameter ${inputParameters.length + 1}`,
            size: '',
            type: 'String'
        };
        setInputParameters([...inputParameters, newParam]);
    };

    const updateInputParameter = (id: string, field: 'size' | 'type', value: string) => {
        setInputParameters(inputParameters.map(param =>
            param.id === id ? { ...param, [field]: value } : param
        ));
    };

    const removeInputParameter = (id: string) => {
        // Prevent removing the first parameter
        if (inputParameters.length > 1 && inputParameters[0].id !== id) {
            setInputParameters(inputParameters.filter(param => param.id !== id));
        }
    };

    const handleStartConfiguration = () => {
        setIsConfigModalOpen(true);
        setConfigurationStarted(true);
    };

    const handleCloseConfigModal = () => {
        setIsConfigModalOpen(false);
    };

    const handleFunctionSelect = (functionType: FunctionType) => {
        const newStep: ConfigurationStep = {
            id: Date.now().toString(),
            type: functionType
        };
        setConfigurationSteps([...configurationSteps, newStep]);
        setIsConfigModalOpen(false);
    };

    const handleAddStep = () => {
        setIsConfigModalOpen(true);
    };

    if (!rule) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-lg text-gray-500">Loading...</div>
                </div>
            </Layout>
        );
    }

    // Predefined functions for the sidebar
    const userDefinedRules = [
        'GPM Text Style', 'Exclusivity', 'MSRP Decimal Rule',
        'Season Ordr Date', 'Create EAN 13', 'Decimal to Binary'
    ];

    const stringFunctions = [
        { name: 'Length Of', type: null },
        { name: 'Find & Replace', type: 'find-replace' as FunctionType },
        { name: 'Concatenate', type: 'concatenate' as FunctionType },
        { name: 'Change Case', type: null },
        { name: 'Extract', type: null },
        { name: 'Create Text With', type: null },
        { name: 'Is Empty', type: null },
        { name: 'Compare Text', type: null }
    ];

    const dateFunctions = [
        { name: 'Date Separator', type: null },
        { name: 'Date Calculator', type: null },
        { name: 'Date Format', type: 'date-format' as FunctionType },
        { name: 'Date Value', type: null }
    ];

    const conditionalFunctions = [
        { name: 'IF', type: 'conditional' as FunctionType },
        { name: 'IFS', type: null },
        { name: 'AND', type: null },
        { name: 'OR', type: null },
        { name: 'NOT', type: null }
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-8 py-6">
                    <h1 className="text-2xl font-bold text-gray-900">{rule.name}</h1>
                    <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                </div>

                <div className="flex">
                    {/* Main Content Area */}
                    <div className="flex-1 px-8 py-6">
                        {/* Define Input Parameters */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Define Input Parameters</h2>

                            <div className="space-y-4">
                                {inputParameters.map((param, index) => (
                                    <div key={param.id} className="flex items-center gap-4">
                                        <div className="w-40 flex-shrink-0">
                                            <label className="text-sm font-medium text-gray-700">{param.name}</label>
                                        </div>
                                        <div className="flex-1 flex gap-4">
                                            <Input
                                                value={param.size}
                                                onChange={(e) => updateInputParameter(param.id, 'size', e.target.value)}
                                                className="flex-1"
                                                placeholder="Enter size"
                                            />
                                            <Select
                                                value={param.type}
                                                onChange={(value) => updateInputParameter(param.id, 'type', value)}
                                                className="flex-1"
                                                options={[
                                                    { value: 'String', label: 'String' },
                                                    { value: 'Number', label: 'Number' },
                                                    { value: 'Date', label: 'Date' },
                                                    { value: 'Boolean', label: 'Boolean' }
                                                ]}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                icon={<PlusOutlined />}
                                                onClick={addInputParameter}
                                                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300"
                                                type="text"
                                            />
                                            <Button
                                                icon={<CloseOutlined />}
                                                onClick={() => removeInputParameter(param.id)}
                                                disabled={index === 0}
                                                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                type="text"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Start Configuration */}
                        <div className="flex flex-col items-center py-8">
                            <p className="text-sm font-bold text-gray-900 mb-4">Start Configuration</p>
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleStartConfiguration}
                                disabled={configurationStarted || configurationSteps.length > 0}
                                className="bg-red-600 hover:bg-red-500 focus:bg-red-500 border-none rounded-lg px-8 disabled:bg-gray-300 disabled:text-gray-500"
                            >
                                Start
                            </Button>
                        </div>

                        {/* Configuration Steps */}
                        {configurationSteps.length > 0 && (
                            <>
                                {/* Vertical Line connecting Start to first Card */}
                                <div className="h-8 w-px bg-gray-300 mx-auto -mt-8"></div>

                                {configurationSteps.map((step, index) => (
                                    <div key={step.id}>
                                        <RuleConfigurationCard
                                            step={step}
                                            inputParameters={inputParameters}
                                        />

                                        {/* Vertical connector line */}
                                        <div className="h-8 w-px bg-gray-300 mx-auto -mt-6"></div>

                                        {/* Add Button - Disabled unless it's the last step */}
                                        <div className="flex justify-center mb-8">
                                            <Button
                                                type="primary"
                                                className={`border-none px-8 h-10 rounded-md ${index === configurationSteps.length - 1
                                                    ? 'bg-red-600 hover:bg-red-500'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    }`}
                                                disabled={index !== configurationSteps.length - 1}
                                                onClick={() => index === configurationSteps.length - 1 && handleAddStep()}
                                            >
                                                Add
                                            </Button>
                                        </div>

                                        {/* Connector line to next card if not the last one */}
                                        {index < configurationSteps.length - 1 && (
                                            <div className="h-8 w-px bg-gray-300 mx-auto -mt-8"></div>
                                        )}
                                    </div>
                                ))}

                                {/* Output Section */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                                    <h3 className="text-base font-medium text-gray-900 mb-4">Output</h3>
                                    <Select placeholder="Select" size="large" className="w-full mb-4" />
                                    <div className="text-sm text-gray-500">Return</div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-between items-center py-6">
                                    <div className="flex gap-3">
                                        <Button
                                            type="primary"
                                            size="large"
                                            className="bg-red-600 hover:bg-red-500 focus:bg-red-500 border-none"
                                        >
                                            Save
                                        </Button>
                                        <Button size="large" className="hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500">Test</Button>
                                        <Button size="large" className="hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500">Generate JavaScript</Button>
                                    </div>
                                    <Button size="large" className="hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500">Cancel</Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Function Library Modal */}
                <Modal
                    title={<h2 className="text-xl font-semibold text-gray-900">Select Function</h2>}
                    open={isConfigModalOpen}
                    onCancel={handleCloseConfigModal}
                    footer={null}
                    width={500}
                    bodyStyle={{ maxHeight: '70vh', overflow: 'auto', padding: '24px' }}
                >
                    <div>
                        <Input
                            placeholder="Search Rule"
                            prefix={<SearchOutlined className="text-gray-400" />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="mb-4 rounded-lg"
                        />

                        <Collapse
                            defaultActiveKey={['1', '2']}
                            ghost
                            className="function-library-collapse"
                        >
                            {/* Rules */}
                            <Panel header={<span className="font-semibold text-gray-900">Rules</span>} key="1">
                                <div className="flex flex-wrap gap-2">
                                    {userDefinedRules.map((func, index) => (
                                        <Button
                                            key={index}
                                            className="rounded-full border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500"
                                            size="small"
                                        >
                                            {func}
                                        </Button>
                                    ))}
                                </div>
                            </Panel>

                            {/* String Functions */}
                            <Panel header={<span className="font-semibold text-gray-900">String Functions</span>} key="2">
                                <div className="flex flex-wrap gap-2">
                                    {stringFunctions.map((func, index) => (
                                        <Button
                                            key={index}
                                            onClick={() => func.type && handleFunctionSelect(func.type)}
                                            className="rounded-full border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500"
                                            size="small"
                                        >
                                            {func.name}
                                        </Button>
                                    ))}
                                </div>
                            </Panel>

                            {/* Date Format */}
                            <Panel header={<span className="font-semibold text-gray-900">Date Format</span>} key="3">
                                <div className="flex flex-wrap gap-2">
                                    {dateFunctions.map((func, index) => (
                                        <Button
                                            key={index}
                                            onClick={() => func.type && handleFunctionSelect(func.type)}
                                            className="rounded-full border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500"
                                            size="small"
                                        >
                                            {func.name}
                                        </Button>
                                    ))}
                                </div>
                            </Panel>

                            {/* Output Card */}
                            <Panel header={<span className="font-semibold text-gray-900">Output Card</span>} key="4">
                                <div className="text-sm text-gray-500">
                                    Output configuration options
                                </div>
                            </Panel>

                            {/* Conditional */}
                            <Panel header={<span className="font-semibold text-gray-900">Conditional</span>} key="5">
                                <div className="flex flex-wrap gap-2">
                                    {conditionalFunctions.map((func, index) => (
                                        <Button
                                            key={index}
                                            onClick={() => func.type && handleFunctionSelect(func.type)}
                                            className="rounded-full border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 focus:border-red-500 focus:text-red-500"
                                            size="small"
                                        >
                                            {func.name}
                                        </Button>
                                    ))}
                                </div>
                            </Panel>
                        </Collapse>
                    </div>
                </Modal>
            </div>
        </Layout>
    );
}
