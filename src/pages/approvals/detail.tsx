import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Spin } from 'antd';
import { ArrowLeftOutlined, LoadingOutlined, PlayCircleOutlined, ExportOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Layout from '../../components/layout/Layout';
import ApproveModal from '../../components/approvals/ApproveModal';
import RejectModal from '../../components/approvals/RejectModal';
import TestRulePanel from '../../components/approvals/TestRulePanel';
import { approvalsApi, type RuleApproval, type ApproveRejectDto } from '../../api/approvals.api';
import { useAuth } from '../../context/AuthContext';
import PermissionGate from '../../components/auth/PermissionGate';
import { PERMISSIONS, getApprovePermission } from '../../constants/permissions';

export default function ApprovalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [approval, setApproval] = useState<RuleApproval | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isTestRulePanelOpen, setIsTestRulePanelOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Get the current user's full name for action_by
  const currentUserName = user ? `${user.first_name} ${user.last_name}` : 'Unknown User';

  // Check if user has permission to approve this specific stage transition
  const canApproveTransition = approval
    ? (() => {
        const approvePermission = getApprovePermission(approval.from_stage, approval.to_stage);
        return approvePermission ? hasPermission(approvePermission) : false;
      })()
    : false;

  // Check if user can reject (needs REJECT_APPROVAL permission)
  const canReject = hasPermission(PERMISSIONS.REJECT_APPROVAL);

  // Check if user can test rules
  const canTestRule = hasPermission(PERMISSIONS.TEST_RULE);

  useEffect(() => {
    if (id) {
      loadApproval();
    }
  }, [id]);

  const loadApproval = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await approvalsApi.getById(id);
      setApproval(data);
    } catch (error) {
      console.error('Failed to load approval:', error);
      message.error('Failed to load approval details');
      navigate('/approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (comment: string) => {
    if (!id) return;

    try {
      setActionLoading(true);
      const actionData: ApproveRejectDto = {
        action: 'APPROVED',
        action_by: currentUserName,
        action_comment: comment || undefined,
      };

      await approvalsApi.approveOrReject(id, actionData);
      message.success('Request approved successfully!');
      setIsApproveModalOpen(false);

      // Reload approval data to show updated status
      await loadApproval();
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      const errorMessage = error?.response?.data?.error || error.message || 'Failed to approve request';
      message.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (comment: string) => {
    if (!id) return;

    try {
      setActionLoading(true);
      const actionData: ApproveRejectDto = {
        action: 'REJECTED',
        action_by: currentUserName,
        action_comment: comment || undefined,
      };

      await approvalsApi.approveOrReject(id, actionData);
      message.success('Request rejected successfully!');
      setIsRejectModalOpen(false);

      // Reload approval data to show updated status
      await loadApproval();
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      const errorMessage = error?.response?.data?.error || error.message || 'Failed to reject request';
      message.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewRule = () => {
    if (approval?.rule_id) {
      window.open(`/rule/create/${approval.rule_id}`, '_blank');
    }
  };

  const handleTestRule = () => {
    setIsTestRulePanelOpen(true);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'WIP':
        return 'text-yellow-700 bg-yellow-100';
      case 'TEST':
        return 'text-blue-700 bg-blue-100';
      case 'PENDING':
        return 'text-purple-700 bg-purple-100';
      case 'PROD':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
        </div>
      </Layout>
    );
  }

  if (!approval) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-600">Approval not found</p>
            <Button type="link" onClick={() => navigate('/approvals')}>
              Back to Approvals
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const isPending = approval.status === 'PENDING';

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <div className="px-8 py-6">
          <button
            onClick={() => navigate('/approvals')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftOutlined />
            <span className="text-sm">Back to Approvals</span>
          </button>
        </div>

        {/* Header with Title and Actions */}
        <div className="px-8 pb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-3">
                {approval.rule_name || `Rule ${approval.rule_id}`}
              </h1>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-md text-sm font-medium ${getStatusColor(approval.from_stage)}`}>
                  {approval.from_stage}
                </span>
                <span className="text-gray-400">→</span>
                <span className={`px-3 py-1 rounded-md text-sm font-medium ${getStatusColor(approval.to_stage)}`}>
                  {approval.to_stage}
                </span>
                <span className="text-gray-400 ml-2">•</span>
                <span className="text-gray-600 ml-2">
                  Version {approval.version_major ?? 0}.{approval.version_minor ?? 1}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isPending ? (
                <Button
                  icon={<ExportOutlined />}
                  onClick={handleViewRule}
                  className="rounded-lg border-gray-300 hover:border-red-500 hover:text-gray-900 h-10 px-5"
                >
                  View Rule
                </Button>
              ) : (
                <>
                  <Button
                    icon={<ExportOutlined />}
                    onClick={handleViewRule}
                    className="rounded-lg border-gray-300 hover:border-red-500 hover:text-gray-900 h-10 px-5"
                  >
                    View Rule
                  </Button>
                  {canTestRule && (
                    <Button
                      icon={<PlayCircleOutlined />}
                      onClick={handleTestRule}
                      className="rounded-lg border-gray-300 hover:border-red-500 hover:text-gray-900 h-10 px-5"
                    >
                      Test Rule
                    </Button>
                  )}
                  {canApproveTransition && (
                    <Button
                      type="primary"
                      onClick={() => setIsApproveModalOpen(true)}
                      className="rounded-lg bg-red-600 hover:bg-red-500 border-none h-10 px-6"
                    >
                      Approve
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      danger
                      onClick={() => setIsRejectModalOpen(true)}
                      className="rounded-lg h-10 px-6"
                    >
                      Reject
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          {/* Request Approved Banner */}
          {approval.status === 'APPROVED' && approval.action_by && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircleOutlined className="text-green-600 text-2xl" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-green-700 mb-4">Request Approved</h2>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Action By</h3>
                      <p className="text-gray-900 font-medium">{approval.action_by}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Timestamp</h3>
                      <p className="text-gray-900 font-medium">
                        {approval.action_at
                          ? new Date(approval.action_at).toLocaleString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {approval.action_comment && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Comments</h3>
                      <p className="text-gray-900 italic">"{approval.action_comment}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Request Rejected Banner */}
          {approval.status === 'REJECTED' && approval.action_by && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <CloseCircleOutlined className="text-red-600 text-2xl" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-red-700 mb-4">Request Rejected</h2>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Action By</h3>
                      <p className="text-gray-900 font-medium">{approval.action_by}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Timestamp</h3>
                      <p className="text-gray-900 font-medium">
                        {approval.action_at
                          ? new Date(approval.action_at).toLocaleString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {approval.action_comment && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Comments</h3>
                      <p className="text-gray-900 italic">"{approval.action_comment}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Requested By and Requested At */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Requested By</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-700 font-medium text-lg">{getInitials(approval.requested_by_name || approval.requested_by)}</span>
                  </div>
                  <span className="text-gray-900 font-medium">{approval.requested_by_name || approval.requested_by}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Requested At</h3>
                <p className="text-gray-900 font-medium">
                  {new Date(approval.requested_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            </div>

            {/* Request Details */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Request Details</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900">
                  {approval.request_comment ||
                    `Requesting approval to move ${approval.rule_name || `Rule ${approval.rule_id}`} from ${approval.from_stage} to ${approval.to_stage}.`}
                </p>
              </div>
            </div>

            {/* Action Details for Withdrawn/Rejected (not Approved, as that is shown in banner) */}
            {!isPending && approval.status !== 'APPROVED' && approval.action_by && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-8 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      {approval.status === 'REJECTED' ? 'Rejected By' : approval.status === 'WITHDRAWN' ? 'Withdrawn By' : 'Action By'}
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-700 font-medium text-lg">{getInitials(approval.action_by_name || approval.action_by)}</span>
                      </div>
                      <span className="text-gray-900 font-medium">{approval.action_by_name || approval.action_by}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Action At</h3>
                    <p className="text-gray-900 font-medium">
                      {approval.action_at
                        ? new Date(approval.action_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {approval.action_comment && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Comments</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900">{approval.action_comment}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Approve Modal */}
        <ApproveModal
          isOpen={isApproveModalOpen}
          onClose={() => setIsApproveModalOpen(false)}
          onSubmit={handleApprove}
          loading={actionLoading}
        />

        {/* Reject Modal */}
        <RejectModal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          onSubmit={handleReject}
          loading={actionLoading}
        />

        {/* Test Rule Panel */}
        {approval && id && (
          <TestRulePanel
            isOpen={isTestRulePanelOpen}
            onClose={() => setIsTestRulePanelOpen(false)}
            approvalId={id}
          />
        )}
      </div>
    </Layout>
  );
}
