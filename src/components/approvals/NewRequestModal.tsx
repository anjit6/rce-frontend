import { useState, useEffect } from 'react';
import { Button, message, Spin } from 'antd';
import { SearchOutlined, LoadingOutlined, CloseOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { rulesApi, type ApprovalRequestRule, type RuleStatus } from '../../api/rules.api';
import { Input } from '../ui/input';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS, getCreateRequestPermission } from '../../constants/permissions';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ruleId: number, ruleName: string, fromStage: RuleStatus, toStage: RuleStatus, comments: string, ruleVersionId: string) => void;
  loading?: boolean;
}

export default function NewRequestModal({ isOpen, onClose, onSubmit, loading = false }: NewRequestModalProps) {
  const { hasPermission } = useAuth();
  const [rules, setRules] = useState<ApprovalRequestRule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [selectedRule, setSelectedRule] = useState<ApprovalRequestRule | null>(null);
  const [loadingRules, setLoadingRules] = useState(false);
  const [comments, setComments] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRules();
      setIsClosing(false);
    } else {
      // Reset state when panel closes
      setSearchQuery('');
      setSelectedRuleId(null);
      setSelectedRule(null);
      setComments('');
    }
  }, [isOpen]);

  // Debounce search and fetch from API
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        loadRules(searchQuery.trim() || undefined);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  const loadRules = async (search?: string) => {
    try {
      setLoadingRules(true);
      const response = await rulesApi.getForApprovalRequest(search);
      setRules(response);
    } catch (error) {
      console.error('Failed to load rules:', error);
      message.error('Failed to load rules');
    } finally {
      setLoadingRules(false);
    }
  };

  const handleRuleSelect = (rule: ApprovalRequestRule) => {
    if (!loading) {
      // Check if user has permission for this rule's stage transition
      const fromStage = rule.status || 'WIP';
      let toStage: RuleStatus = 'TEST';

      if (fromStage === 'WIP') {
        toStage = 'TEST';
      } else if (fromStage === 'TEST') {
        toStage = 'PENDING';
      } else if (fromStage === 'PENDING') {
        toStage = 'PROD';
      }

      // Check stage-specific permission first, then fall back to generic permission
      const stageSpecificPermission = getCreateRequestPermission(fromStage, toStage);
      const hasStagePermission = stageSpecificPermission ? hasPermission(stageSpecificPermission) : false;
      const hasGenericPermission = hasPermission(PERMISSIONS.CREATE_APPROVAL_REQUEST);

      if (!hasStagePermission && !hasGenericPermission) {
        message.warning(`You don't have permission to create ${fromStage} to ${toStage} approval requests`);
        return;
      }

      setSelectedRuleId(rule.id);
      setSelectedRule(rule);
    }
  };

  const handleSubmit = () => {
    if (!selectedRuleId || !selectedRule) {
      message.warning('Please select a rule');
      return;
    }

    if (!selectedRule.rule_version_id) {
      message.error('Selected rule does not have a version ID. Please contact support.');
      return;
    }

    // Determine promotion path based on current status
    // Default to WIP if status is not provided
    const fromStage = selectedRule.status || 'WIP';
    let toStage: RuleStatus = 'TEST';

    if (fromStage === 'WIP') {
      toStage = 'TEST';
    } else if (fromStage === 'TEST') {
      toStage = 'PENDING';
    } else if (fromStage === 'PENDING') {
      toStage = 'PROD';
    }

    // Validate user has permission for this stage transition
    const stageSpecificPermission = getCreateRequestPermission(fromStage, toStage);
    const hasStagePermission = stageSpecificPermission ? hasPermission(stageSpecificPermission) : false;
    const hasGenericPermission = hasPermission(PERMISSIONS.CREATE_APPROVAL_REQUEST);

    if (!hasStagePermission && !hasGenericPermission) {
      message.error(`You don't have permission to create ${fromStage} to ${toStage} approval requests`);
      return;
    }

    onSubmit(selectedRuleId, selectedRule.name, fromStage, toStage, comments, selectedRule.rule_version_id);
  };

  const handleClose = () => {
    if (!loading) {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 300); // Match animation duration
    }
  };

  // Helper to check if user has permission to create request for a rule's stage transition
  const canCreateRequestForRule = (rule: ApprovalRequestRule): boolean => {
    const fromStage = rule.status || 'WIP';
    let toStage: RuleStatus = 'TEST';

    if (fromStage === 'WIP') {
      toStage = 'TEST';
    } else if (fromStage === 'TEST') {
      toStage = 'PENDING';
    } else if (fromStage === 'PENDING') {
      toStage = 'PROD';
    }

    const stageSpecificPermission = getCreateRequestPermission(fromStage, toStage);
    const hasStagePermission = stageSpecificPermission ? hasPermission(stageSpecificPermission) : false;
    const hasGenericPermission = hasPermission(PERMISSIONS.CREATE_APPROVAL_REQUEST);

    return hasStagePermission || hasGenericPermission;
  };

  const getStatusColor = (status: RuleStatus): string => {
    switch (status) {
      case 'WIP':
        return 'text-yellow-700 bg-yellow-50 border border-yellow-200';
      case 'TEST':
        return 'text-blue-700 bg-blue-50 border border-blue-200';
      case 'PENDING':
        return 'text-purple-700 bg-purple-50 border border-purple-200';
      case 'PROD':
        return 'text-green-700 bg-green-50 border border-green-200';
      default:
        return 'text-gray-700 bg-gray-50 border border-gray-200';
    }
  };

  const getPromotionPath = () => {
    if (!selectedRule) return null;

    // Default to WIP if status is not provided
    const fromStage = selectedRule.status || 'WIP';
    let toStage: RuleStatus = 'TEST';

    if (fromStage === 'WIP') {
      toStage = 'TEST';
    } else if (fromStage === 'TEST') {
      toStage = 'PENDING';
    } else if (fromStage === 'PENDING') {
      toStage = 'PROD';
    }

    return { fromStage, toStage };
  };

  if (!isOpen) return null;

  const promotionPath = getPromotionPath();

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
          width: '550px',
          animation: isClosing ? 'slideOutToRight 0.3s ease-in' : 'slideInFromRight 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">New Request</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <CloseOutlined className="text-lg" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Select Rule Section */}
          <div className="mb-6">
            <label className="block text-base font-medium text-gray-900 mb-3">Select Rule</label>
            <div className="relative mb-3">
              <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
              <Input
                placeholder="Search rule"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg h-10"
                disabled={loading}
              />
            </div>

            <div className="border border-gray-200 rounded-lg max-h-64 overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {loadingRules ? (
                  <div className="flex items-center justify-center py-12">
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                  </div>
                ) : rules.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    {searchQuery ? 'No rules found matching your search' : 'No rules available'}
                  </div>
                ) : (
                  <div>
                    {rules.map((rule, index) => {
                      const canCreate = canCreateRequestForRule(rule);
                      return (
                        <div
                          key={rule.id}
                          className={`px-4 py-3 transition-all border-l-4 ${
                            selectedRuleId === rule.id
                              ? 'bg-red-50 border-l-red-500'
                              : canCreate
                              ? 'hover:bg-gray-50 border-l-transparent cursor-pointer'
                              : 'opacity-50 border-l-transparent cursor-not-allowed'
                          } ${index < rules.length - 1 ? 'border-b border-gray-200' : ''}`}
                          onClick={() => canCreate && handleRuleSelect(rule)}
                          title={!canCreate ? 'You don\'t have permission to create requests for this rule\'s stage' : ''}
                        >
                          <div className="font-medium text-gray-900 text-sm">{rule.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {rule.id} • Version {rule.version_major}.{rule.version_minor} • Status: {rule.status || '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Promote Section - Only show when a rule is selected */}
          {selectedRule && promotionPath && (
            <div className="mb-6">
              <label className="block text-base font-medium text-gray-900 mb-3">Promote</label>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-md text-sm font-medium ${getStatusColor(promotionPath.fromStage)}`}>
                  {promotionPath.fromStage}
                </span>
                <ArrowRightOutlined className="text-gray-400" />
                <span className={`px-4 py-2 rounded-md text-sm font-medium ${getStatusColor(promotionPath.toStage)}`}>
                  {promotionPath.toStage}
                </span>
              </div>
            </div>
          )}

          {/* Comments Section - Only show when a rule is selected */}
          {selectedRule && (
            <div className="mb-6">
              <label className="block text-base font-medium text-gray-900 mb-3">Comments</label>
              <textarea
                placeholder="Enter your request comments..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={8}
                disabled={loading}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 resize-none text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
          <Button
            onClick={handleClose}
            className="h-11 px-8 rounded-lg border-gray-300 hover:border-gray-400 font-medium"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            className="h-11 px-8 rounded-lg bg-red-600 hover:bg-red-500 border-none font-medium"
          >
            Submit
          </Button>
        </div>
      </div>
    </>
  );
}
