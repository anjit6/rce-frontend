import { useState, useEffect } from 'react';
import { Button, message, Spin, Modal } from 'antd';
import { LoadingOutlined, CloseOutlined } from '@ant-design/icons';
import { rulesApi } from '../../api/rules.api';
import { Input } from '../ui/input';
import { compileRule, type Rule as CompilerRule } from '../../utils/ruleCompiler';

interface TestRulePanelProps {
  isOpen: boolean;
  onClose: () => void;
  ruleId: number;
  ruleName: string;
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

export default function TestRulePanel({ isOpen, onClose, ruleId, ruleName }: TestRulePanelProps) {
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
  }, [isOpen, ruleId]);

  const loadRuleAndGenerateCode = async () => {
    try {
      setLoading(true);
      const response = await rulesApi.getComplete(ruleId);

      // Extract input parameters from rule_function
      const params: InputParam[] = response.rule_function.input_params || [];
      setInputParams(params);

      // Initialize param values using fieldName as key (matching create.tsx behavior)
      const initialValues: Record<string, any> = {};
      params.forEach(param => {
        const key = param.fieldName || param.name;
        initialValues[key] = '';
      });
      setParamValues(initialValues);

      // Generate JavaScript code using the compiler
      try {
        const ruleForCompiler: CompilerRule = {
          id: response.rule.id,
          name: response.rule.name,
          inputParams: response.rule_function.input_params || [],
          steps: response.steps || []
        };

        const compiledCode = compileRule(ruleForCompiler);
        setGeneratedCode(compiledCode);
        console.log('✅ Generated code for testing:', compiledCode);
      } catch (compileError) {
        console.error('Failed to compile rule:', compileError);
        Modal.error({
          title: 'Compilation Failed',
          content: 'Failed to generate JavaScript code. Please check the rule configuration.',
          okText: 'OK',
          centered: true
        });
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
      .filter(param => {
        const paramKey = param.fieldName || param.name;
        return param.mandatory && !paramValues[paramKey];
      })
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

      // Transform paramValues from fieldName keys to name keys
      // The UI uses fieldName as keys, but compiled code expects name as keys
      const transformedInputs: Record<string, any> = {};
      inputParams.forEach(param => {
        const paramKey = param.fieldName || param.name;
        transformedInputs[param.name] = paramValues[paramKey];
      });

      // Execute the function with transformed inputs
      const result = await ruleFunction(transformedInputs);
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
                  const paramKey = param.fieldName || param.name;
                  const displayName = param.fieldName || param.name;
                  return (
                    <div key={paramKey} className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        {displayName}
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
                        {testResult?.value !== undefined
                          ? (typeof testResult.value === 'object'
                            ? (testResult.value?.value !== undefined ? String(testResult.value.value) : JSON.stringify(testResult.value))
                            : String(testResult.value))
                          : (typeof testResult === 'object' ? JSON.stringify(testResult) : String(testResult))}
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
