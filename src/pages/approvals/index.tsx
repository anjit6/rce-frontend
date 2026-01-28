import { useState, useEffect } from 'react';
import { Button, message, Dropdown, Space } from 'antd';
import { PlusOutlined, SearchOutlined, DownOutlined, FilterOutlined } from '@ant-design/icons';
import Layout from '../../components/layout/Layout';
import ApprovalsList from '../../components/approvals/ApprovalsList';
import NewRequestModal from '../../components/approvals/NewRequestModal';
import { Input } from '../../components/ui/input';
import { approvalsApi, type CreateApprovalDto, type RuleStatus } from '../../api/approvals.api';
import { useAuth } from '../../context/AuthContext';
import PermissionGate from '../../components/auth/PermissionGate';
import { PERMISSIONS } from '../../constants/permissions';

type TabType = 'pending' | 'all';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedStage, setSelectedStage] = useState<RuleStatus | null>(null);
  const [selectedRequestedBy, setSelectedRequestedBy] = useState<string | null>(null);

  // Get the current user's ID for requested_by
  const currentUserId = user?.id || '';

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    document.title = 'Approvals - RCE';
  }, []);

  const handleNewRequest = async (
    ruleId: number,
    ruleName: string,
    fromStage: 'WIP' | 'TEST' | 'PENDING' | 'PROD',
    toStage: 'WIP' | 'TEST' | 'PENDING' | 'PROD',
    comments: string,
    ruleVersionId: string
  ) => {
    try {
      setCreatingRequest(true);

      // if (!ruleVersionId) {
      //   message.error('Rule version ID is required');
      //   return;
      // }

      const requestData: CreateApprovalDto = {
        rule_version_id: ruleVersionId,
        rule_id: ruleId,
        from_stage: fromStage,
        to_stage: toStage,
        requested_by: currentUserId,
        request_comment: comments || `Requesting approval to move ${ruleName} from ${fromStage} to ${toStage}`,
      };

      await approvalsApi.create(requestData);

      message.success('Approval request created successfully!');
      setIsNewRequestModalOpen(false);

      // Trigger refresh of the approvals list
      setRefreshTrigger((prev) => prev + 1);
    } catch (error: any) {
      console.error('Failed to create approval request:', error);
      const errorMessage = error?.response?.data?.error || error.message || 'Failed to create approval request';
      message.error(errorMessage);
    } finally {
      setCreatingRequest(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="px-8 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">Approvals</h1>
        </div>

        {/* Tabs, Search and Actions Bar */}
        <div className="px-8 pb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Tabs and Search */}
            <div className="flex items-center gap-4">
              {/* Toggle Buttons */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
                <button
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${selectedTab === 'pending'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  onClick={() => setSelectedTab('pending')}
                >
                  Pending Requests
                </button>
                <button
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${selectedTab === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  onClick={() => setSelectedTab('all')}
                >
                  All Requests
                </button>
              </div>

              {/* Search Input */}
              <div className="relative" style={{ width: '25rem' }}>
                <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                <Input
                  placeholder="Search by Request ID and details"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 rounded-lg h-10"
                />
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-3">
              <Space size="middle">
                {/* Combined Filter Dropdown */}
                <Dropdown
                  menu={{
                    items: [
                      {
                        type: 'group',
                        label: <span className="text-xs font-semibold text-gray-500 px-2">Status</span>,
                      },
                      {
                        key: 'stage-all',
                        label: (
                          <div className="px-2 py-1">
                            <span className="text-gray-700">All Stages</span>
                          </div>
                        ),
                      },
                      {
                        key: 'WIP',
                        label: (
                          <div className="px-2 py-1">
                            <span className="text-gray-700">WIP</span>
                          </div>
                        ),
                      },
                      {
                        key: 'TEST',
                        label: (
                          <div className="px-2 py-1">
                            <span className="text-gray-700">TEST</span>
                          </div>
                        ),
                      },
                      {
                        key: 'PENDING',
                        label: (
                          <div className="px-2 py-1">
                            <span className="text-gray-700">PENDING</span>
                          </div>
                        ),
                      },
                      {
                        key: 'PROD',
                        label: (
                          <div className="px-2 py-1">
                            <span className="text-gray-700">PRODUCTION</span>
                          </div>
                        ),
                      },
                      {
                        type: 'divider',
                      },
                      {
                        type: 'group',
                        label: <span className="text-xs font-semibold text-gray-500 px-2">Requested By</span>,
                      },
                      {
                        key: 'user-all',
                        label: (
                          <div className="px-2 py-1">
                            <span className="text-gray-700">All Users</span>
                          </div>
                        ),
                      },
                      // TODO: Fetch users from API and display here
                      // Placeholder users for now
                      {
                        key: 'Current User',
                        label: (
                          <div className="px-2 py-1">
                            <span className="text-gray-700">Current User</span>
                          </div>
                        ),
                      },
                      {
                        key: 'John Doe',
                        label: (
                          <div className="px-2 py-1">
                            <span className="text-gray-700">John Doe</span>
                          </div>
                        ),
                      },
                      {
                        key: 'Mike Johnson',
                        label: (
                          <div className="px-2 py-1">
                            <span className="text-gray-700">Mike Johnson</span>
                          </div>
                        ),
                      },
                    ],
                    onClick: ({ key }) => {
                      // Handle stage filter
                      if (key === 'stage-all') {
                        setSelectedStage(null);
                      } else if (['WIP', 'TEST', 'PENDING', 'PROD'].includes(key)) {
                        setSelectedStage(key as RuleStatus);
                      }
                      // Handle requested by filter
                      else if (key === 'user-all') {
                        setSelectedRequestedBy(null);
                      } else if (['Current User', 'John Doe', 'Mike Johnson'].includes(key)) {
                        setSelectedRequestedBy(key);
                      }
                    },
                    className: 'min-w-[200px]',
                  }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Button
                    icon={<FilterOutlined />}
                    className="rounded-lg border-gray-200 hover:border-red-500 hover:text-gray-900 focus:border-red-500 focus:text-gray-900 h-10"
                  >
                    {selectedStage || selectedRequestedBy ? (
                      <span className="ml-1">
                        {selectedStage && selectedRequestedBy
                          ? `${selectedStage === 'PROD' ? 'PRODUCTION' : selectedStage}, ${selectedRequestedBy}`
                          : selectedStage
                          ? selectedStage === 'PROD'
                            ? 'PRODUCTION'
                            : selectedStage
                          : selectedRequestedBy}
                      </span>
                    ) : (
                      <span className="ml-1">Filter</span>
                    )}
                    <DownOutlined className="ml-2 text-xs" />
                  </Button>
                </Dropdown>

                {/* New Request Button - only shown if user has CREATE_APPROVAL_REQUEST permission */}
                <PermissionGate permissions={[PERMISSIONS.CREATE_APPROVAL_REQUEST]}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsNewRequestModalOpen(true)}
                    className="rounded-lg bg-red-600 hover:bg-red-500 border-none h-10 px-5"
                  >
                    New Request
                  </Button>
                </PermissionGate>
              </Space>
            </div>
          </div>
        </div>

        {/* Approvals List */}
        <div className="px-8 pb-8">
          <ApprovalsList
            selectedTab={selectedTab}
            searchQuery={searchQuery}
            refreshTrigger={refreshTrigger}
            selectedStage={selectedStage}
            selectedRequestedBy={selectedRequestedBy}
          />
        </div>

        {/* New Request Modal */}
        <NewRequestModal
          isOpen={isNewRequestModalOpen}
          onClose={() => setIsNewRequestModalOpen(false)}
          onSubmit={handleNewRequest}
          loading={creatingRequest}
        />
      </div>
    </Layout>
  );
}
