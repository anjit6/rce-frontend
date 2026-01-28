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

export default function TestRulePanel({ isOpen, onClose, ruleId, approvalId }: TestRulePanelProps) {
  const [inputParams, setInputParams] = useState<InputParam[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadRuleAndGenerateCode();
      setIsClosing(false);
      setTestResult(null);
      setFieldErrors({});
    } else {
      // Reset state when panel closes
      setParamValues({});
      setTestResult(null);
      setGeneratedCode('');
      setFieldErrors({});
    }
  }, [isOpen, ruleId, approvalId]);

  const loadRuleAndGenerateCode = async () => {
    try {
      setLoading(true);

      if (approvalId) {
        // Load from approval API - use pre-compiled code directly from API
        const approval = await approvalsApi.getById(approvalId);

        // Parse rule_function_input_params from approval response
        // Use name as the key (what the pre-compiled code expects)
        const params: InputParam[] = (approval.rule_function_input_params || []).map((param: any) => ({
          name: param.name,
          fieldName: param.name, // Use name for both (API uses 'name' consistently)
          dataType: param.data_type || param.dataType,
          mandatory: param.mandatory
        }));
        setInputParams(params);

        // Initialize param values using name as key (what pre-compiled code expects)
        const initialValues: Record<string, any> = {};
        params.forEach(param => {
          initialValues[param.name] = '';
        });
        setParamValues(initialValues);

        // Use pre-compiled code directly from API (no need to compile)
        if (approval.rule_function_code) {
          console.log("=== GENERATED RULE CODE (from Approval API) ===");
          console.log(approval.rule_function_code);
          console.log("=== END GENERATED CODE ===");
          setGeneratedCode(approval.rule_function_code);
        } else {
          Modal.error({
            title: 'No Code Available',
            content: 'This approval does not have pre-compiled code.',
            okText: 'OK',
            centered: true
          });
        }
      } else if (ruleId) {
        // Load from rules API and compile (Configuration page flow)
        const response = await rulesApi.getComplete(ruleId);

        console.log("=== API RESPONSE ===");
        console.log("Rule:", response.rule);
        console.log("Steps:", response.steps);
        console.log("Rule Function:", response.rule_function);

        // Extract input parameters from rule_function
        // Normalize to ensure consistent structure
        const params: InputParam[] = (response.rule_function.input_params || []).map((param: any) => ({
          name: param.name,
          fieldName: param.fieldName || param.name,
          dataType: param.data_type || param.dataType,
          mandatory: param.mandatory
        }));
        setInputParams(params);

        // Initialize param values using fieldName as key (consistent with Configuration page)
        const initialValues: Record<string, any> = {};
        params.forEach(param => {
          const key = param.fieldName || param.name;
          if (key) {
            initialValues[key] = '';
          }
        });
        setParamValues(initialValues);

        // Generate JavaScript code using the compiler
        try {
          // Validate parameters have valid fieldNames
          const invalidParams = params.filter(p => !p.fieldName || p.fieldName.trim() === '');
          if (invalidParams.length > 0) {
            throw new Error('Some parameters are missing valid names. Please check the rule configuration.');
          }

          // Validate steps exist
          if (!response.steps || response.steps.length === 0) {
            throw new Error('Rule has no steps defined. Please configure the rule first.');
          }

          // Transform parameters to match compiler expectations (use fieldName like Configuration page)
          const compilerInputParams = params.map(param => ({
            id: param.fieldName!,
            name: param.fieldName!,
            dataType: param.dataType || 'STRING',
            mandatory: param.mandatory ? 'true' : 'false',
            sequence: 0
          }));

          const ruleForCompiler: CompilerRule = {
            id: response.rule.id,
            name: response.rule.name,
            inputParams: compilerInputParams,
            steps: response.steps // Compiler now handles API format (next_step, output_data, lhs_type/lhs_value, etc.)
          };

          console.log("=== DATA SENT TO COMPILER ===");
          console.log(JSON.stringify(ruleForCompiler, null, 2));

          const compiledCode = compileRule(ruleForCompiler);
          console.log("=== GENERATED RULE CODE (from Rules API) ===");
          console.log(compiledCode);
          console.log("=== END GENERATED CODE ===");
          setGeneratedCode(compiledCode);
        } catch (compileError) {
          console.error("Compilation Error:", compileError);
          Modal.error({
            title: 'Compilation Failed',
            content: `Failed to generate JavaScript code: ${(compileError as Error).message}`,
            okText: 'OK',
            centered: true
          });
        }
      }
    } catch (error) {
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
    // Clear error when user starts typing
    if (fieldErrors[paramName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[paramName];
        return newErrors;
      });
    }
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
    const errors: Record<string, string> = {};
    inputParams.forEach(param => {
      // Use the same key logic as paramValues initialization
      const paramKey = approvalId ? param.name : (param.fieldName || param.name);
      if (param.mandatory && !paramValues[paramKey]?.trim()) {
        errors[paramKey] = 'This field is required';
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setExecuting(true);
    setTestResult(null);
    setFieldErrors({});

    try {
      console.log("=== EXECUTING RULE ===");
      console.log("Input Parameters:", paramValues);

      // Extract the function name from the generated code
      const functionNameMatch = generatedCode.match(/async function (\w+)/);
      if (!functionNameMatch) {
        throw new Error('Could not find function name in generated code');
      }
      const functionName = functionNameMatch[1];
      console.log("Function Name:", functionName);

      // Create and execute the function
      const functionCode = generatedCode + `\nreturn ${functionName};`;
      const ruleFunction = new Function(functionCode)();

      // Execute the function with param values (keys already match what compiled code expects)
      console.log("Executing with input data:", paramValues);
      const result = await ruleFunction(paramValues);
      console.log("=== EXECUTION RESULT ===");
      console.log(result);

      setTestResult(result);

      if (result.success) {
        message.success('Test executed successfully!');
      } else {
        console.error("Execution failed with error:", result.error);
      }
    } catch (error: any) {
      console.error("=== EXECUTION EXCEPTION ===");
      console.error(error);
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
          <h2 className="text-2xl font-semibold text-gray-900">Test Rule</h2>
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
                  // Use consistent key logic: approvalId uses name, ruleId uses fieldName
                  const paramKey = approvalId ? param.name : (param.fieldName || param.name);
                  const displayName = param.name;
                  const hasError = !!fieldErrors[paramKey];
                  return (
                    <div key={paramKey} className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        {displayName}
                        {param.mandatory && <span className="text-black-500 ml-1">*</span>}
                      </label>
                      <Input
                        value={paramValues[paramKey] || ''}
                        onChange={(e) => handleParamChange(paramKey, e.target.value)}
                        placeholder={`Enter ${displayName}`}
                        disabled={executing}
                        inputSize="lg"
                        variant={hasError ? 'error' : 'default'}
                      />
                      {hasError && (
                        <p className="text-red-500 text-xs mt-1">{fieldErrors[paramKey]}</p>
                      )}
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
