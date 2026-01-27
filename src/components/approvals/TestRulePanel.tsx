import { useState, useEffect } from 'react';
import { Button, message, Spin, Modal } from 'antd';
import { LoadingOutlined, CloseOutlined } from '@ant-design/icons';
import { rulesApi } from '../../api/rules.api';
import { approvalsApi } from '../../api/approvals.api';
import { Input } from '../ui/input';
import { compileRule, type Rule as CompilerRule } from '../../utils/ruleCompiler';

interface TestRulePanelProps {
  isOpen: boolean;
  onClose: () => void;
  ruleId?: number;
  ruleName: string;
  approvalId?: string;
}

interface InputParam {
  name: string;
  fieldName?: string;
  dataType?: string;
  mandatory?: boolean;
}

interface TestResult {
  success: boolean;
  value?: any;
  error?: {
    message: string;
    code?: number;
  };
}

export default function TestRulePanel({ isOpen, onClose, ruleId, ruleName, approvalId }: TestRulePanelProps) {
  const [inputParams, setInputParams] = useState<InputParam[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadRuleAndGenerateCode();
      setIsClosing(false);
      setTestResult(null);
    } else {
      // Reset state when panel closes
      setParamValues({});
      setTestResult(null);
      setGeneratedCode('');
    }
  }, [isOpen, ruleId, approvalId]);

  const loadRuleAndGenerateCode = async () => {
    try {
      setLoading(true);

      if (approvalId) {
        // Load from approval API and compile from steps (same as Configuration flow)
        const approval = await approvalsApi.getById(approvalId);

        // Parse rule_function_input_params from approval response
        // Note: Backend returns params with 'name' field, not 'fieldName'
        const params: InputParam[] = (approval.rule_function_input_params || []).map((param: any) => ({
          name: param.name,
          fieldName: param.fieldName || param.name, // Use name as fallback for display
          dataType: param.data_type || param.dataType,
          mandatory: param.mandatory
        }));
        setInputParams(params);

        console.log('📋 Loaded input params from approval:', params);

        // Initialize param values using name as key
        const initialValues: Record<string, any> = {};
        params.forEach(param => {
          initialValues[param.name] = '';
        });
        setParamValues(initialValues);

        // Compile from steps instead of using pre-compiled code (ensures consistency with Configuration flow)
        if (approval.rule_steps && approval.rule_steps.length > 0) {
          try {
            // Validate parameters have valid names
            const invalidParams = params.filter(p => !p.name || p.name.trim() === '');
            if (invalidParams.length > 0) {
              throw new Error('Some parameters are missing valid names. Please check the rule configuration.');
            }

            // Transform parameters to match compiler expectations
            const compilerInputParams = params.map(param => ({
              id: param.name,
              name: param.name,
              dataType: param.dataType || 'STRING',
              mandatory: param.mandatory ? 'true' : 'false',
              sequence: 0
            }));

            // Transform steps from database format (snake_case) to compiler format (camelCase)
            const transformedSteps = (approval.rule_steps || []).map((step: any) => ({
              id: step.id,
              type: step.type,
              outputVariableName: step.output_variable_name,
              returnType: step.return_type,
              next: step.next_step,
              sequence: step.sequence,
              // Transform subFunction data
              subFunction: step.subfunction_id ? {
                id: step.subfunction_id,
                name: step.subfunction_name,
                inputParams: (step.subfunction_params || []).map((p: any) => ({
                  subFuncParamId: p.subfunction_param_name,
                  name: p.subfunction_param_name,
                  data: {
                    type: p.data_type,
                    value: p.data_value,
                    dataType: p.data_value_type
                  }
                }))
              } : undefined,
              // Transform conditions
              conditions: (step.conditions || []).map((c: any) => ({
                sequence: c.sequence,
                and_or: c.and_or,
                lhs: {
                  type: c.lhs_type,
                  value: c.lhs_value,
                  dataType: c.lhs_data_type
                },
                operator: c.operator,
                rhs: {
                  type: c.rhs_type,
                  value: c.rhs_value,
                  dataType: c.rhs_data_type
                }
              })),
              // Transform output data
              data: step.output_data ? {
                responseType: step.output_data.response_type || 'success',
                type: step.output_data.data_type,
                value: step.output_data.data_value,
                dataType: step.output_data.data_value_type,
                errorMessage: step.output_data.error_message,
                errorCode: step.output_data.error_code
              } : undefined
            }));

            const ruleForCompiler: CompilerRule = {
              id: approval.rule_id,
              name: approval.rule_name || `Rule ${approval.rule_id}`,
              inputParams: compilerInputParams,
              steps: transformedSteps
            };

            console.log('🔧 Compiler input params:', compilerInputParams);
            console.log('🔧 Original rule steps:', approval.rule_steps);
            console.log('🔧 Transformed steps:', transformedSteps);

            const compiledCode = compileRule(ruleForCompiler);
            setGeneratedCode(compiledCode);
            console.log('✅ Compiled rule code from steps:', compiledCode);
          } catch (compileError) {
            console.error('Failed to compile rule from steps:', compileError);
            Modal.error({
              title: 'Compilation Failed',
              content: `Failed to generate JavaScript code: ${(compileError as Error).message}`,
              okText: 'OK',
              centered: true
            });
          }
        } else {
          Modal.error({
            title: 'No Rule Steps',
            content: 'This approval does not have associated rule steps for compilation.',
            okText: 'OK',
            centered: true
          });
        }
      } else if (ruleId) {
        // Load from rules API and compile (Configuration page flow)
        const response = await rulesApi.getComplete(ruleId);

        // Extract input parameters from rule_function
        // Normalize to ensure consistent structure
        const params: InputParam[] = (response.rule_function.input_params || []).map((param: any) => ({
          name: param.name,
          fieldName: param.fieldName || param.name,
          dataType: param.data_type || param.dataType,
          mandatory: param.mandatory
        }));
        setInputParams(params);

        console.log('📋 Loaded input params from rule:', params);

        // Initialize param values using name as key (consistent with approval flow)
        const initialValues: Record<string, any> = {};
        params.forEach(param => {
          initialValues[param.name] = '';
        });
        setParamValues(initialValues);

        // Generate JavaScript code using the compiler
        try {
          // Validate parameters have valid names
          const invalidParams = params.filter(p => !p.name || p.name.trim() === '');
          if (invalidParams.length > 0) {
            throw new Error('Some parameters are missing valid names. Please check the rule configuration.');
          }

          // Transform parameters to match compiler expectations
          const compilerInputParams = params.map(param => ({
            id: param.name,
            name: param.name,
            dataType: param.dataType || 'STRING',
            mandatory: param.mandatory ? 'true' : 'false',
            sequence: 0
          }));

          const ruleForCompiler: CompilerRule = {
            id: response.rule.id,
            name: response.rule.name,
            inputParams: compilerInputParams,
            steps: response.steps || []
          };

          console.log('🔧 Compiler input params:', compilerInputParams);
          console.log('🔧 Rule steps:', response.steps);

          const compiledCode = compileRule(ruleForCompiler);
          setGeneratedCode(compiledCode);
          console.log('✅ Generated code for testing:', compiledCode);
        } catch (compileError) {
          console.error('Failed to compile rule:', compileError);
          Modal.error({
            title: 'Compilation Failed',
            content: `Failed to generate JavaScript code: ${(compileError as Error).message}`,
            okText: 'OK',
            centered: true
          });
        }
      }
    } catch (error) {
      console.error('Failed to load rule:', error);
      message.error('Failed to load rule');
    } finally {
      setLoading(false);
    }
  };

  const handleParamChange = (paramName: string, value: string) => {
    setParamValues(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const handleExecuteTest = async () => {
    if (!generatedCode) {
      Modal.error({
        title: 'No Code Generated',
        content: 'Unable to execute test. The rule code could not be generated.',
        okText: 'OK',
        centered: true
      });
      return;
    }

    // Validate required parameters
    const missingParams = inputParams
      .filter(param => param.mandatory && !paramValues[param.name])
      .map(param => param.fieldName || param.name);

    if (missingParams.length > 0) {
      message.warning(`Please fill in required fields: ${missingParams.join(', ')}`);
      return;
    }

    setExecuting(true);
    setTestResult(null);

    try {
      // Extract the function name from the generated code
      const functionNameMatch = generatedCode.match(/async function (\w+)/);
      if (!functionNameMatch) {
        throw new Error('Could not find function name in generated code');
      }
      const functionName = functionNameMatch[1];

      // Create and execute the function
      const functionCode = generatedCode + `\nreturn ${functionName};`;
      const ruleFunction = new Function(functionCode)();

      console.log('📥 Input Parameters:', inputParams);
      console.log('📥 Param Values:', paramValues);
      console.log('🔧 Function Name:', functionName);

      // Execute the function with param values (keys already match what compiled code expects)
      const result = await ruleFunction(paramValues);
      console.log('📤 Execution Result:', result);

      setTestResult(result);

      if (result.success) {
        message.success('Test executed successfully!');
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        error: { message: error.message || 'An error occurred during execution' }
      });
      message.error('Test execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const handleClose = () => {
    if (!executing) {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 300);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={handleClose}
      />

      {/* Sliding Panel */}
      <div
        className="fixed top-0 right-0 h-full bg-white shadow-2xl z-50 overflow-y-auto border-l border-gray-200 flex flex-col"
        style={{
          width: '600px',
          animation: isClosing ? 'slideOutToRight 0.3s ease-in' : 'slideInFromRight 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">{ruleName}</h2>
          <button
            onClick={handleClose}
            disabled={executing}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <CloseOutlined className="text-xl" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            </div>
          ) : (
            <div>
              <h3 className="text-md font-semibold mb-4">Input Parameters</h3>
              {inputParams.length === 0 ? (
                <p className="text-gray-500 text-sm mb-4">No input parameters defined for this rule.</p>
              ) : (
                inputParams.map((param) => {
                  // Use name as key (what compiled code expects), fieldName for display
                  const paramKey = param.name;
                  const displayName = param.fieldName || param.name;
                  return (
                    <div key={paramKey} className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        {displayName}
                        {param.mandatory && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <Input
                        value={paramValues[paramKey] || ''}
                        onChange={(e) => handleParamChange(paramKey, e.target.value)}
                        placeholder={`Enter ${displayName}`}
                        disabled={executing}
                        inputSize="lg"
                      />
                    </div>
                  );
                })
              )}

              <Button
                onClick={handleExecuteTest}
                loading={executing}
                disabled={executing || loading}
                className="w-full mt-4 bg-red-500 hover:bg-red-400 focus:bg-red-400 border-none"
                type="primary"
                size="large"
              >
                Execute Test
              </Button>

              {testResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {testResult.success === false && testResult.error ? (
                    <>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Error:</h4>
                      <p className="text-sm text-gray-800">
                        {testResult.error.message || 'An unknown error occurred'}
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Result:</h4>
                      <p className="text-sm text-gray-800 break-all">
                        {testResult.value !== undefined
                          ? (typeof testResult.value === 'object'
                            ? JSON.stringify(testResult.value, null, 2)
                            : String(testResult.value))
                          : 'No result'}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex items-center justify-end px-6 py-5 border-t border-gray-200 bg-white">
          <Button
            onClick={handleClose}
            disabled={executing}
            className="px-8 h-11 rounded-lg border border-gray-300 hover:border-gray-400 font-medium text-base"
          >
            Close
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes slideOutToRight {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );
}
