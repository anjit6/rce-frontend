import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Spin, message, Pagination } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { approvalsApi, type ApprovalStatus, type RuleStatus } from '../../api/approvals.api';

interface ApprovalsListProps {
  selectedTab: 'pending' | 'all';
  searchQuery: string;
  refreshTrigger?: number;
  selectedStage?: RuleStatus | null;
  selectedRequestedBy?: string | null;
}

interface TableApproval {
  key: string;
  id: string;
  requestDetails: {
    name: string;
    transition: string;
  };
  version: string;
  requestedBy: string;
  requestedAt: string;
  requestStatus: ApprovalStatus;
  rule_id: number;
}

export default function ApprovalsList({ selectedTab, searchQuery, refreshTrigger, selectedStage, selectedRequestedBy }: ApprovalsListProps) {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<TableApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadApprovals();
  }, [selectedTab, searchQuery, currentPage, refreshTrigger, selectedStage, selectedRequestedBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, searchQuery, selectedStage, selectedRequestedBy]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      // Determine status filter based on tab
      const statusFilter: ApprovalStatus | 'ALL' = selectedTab === 'pending' ? 'PENDING' : 'ALL';

      const response = await approvalsApi.getAll({
        page: currentPage,
        limit: pageSize,
        status: statusFilter,
        search: searchQuery || undefined,
        requested_by: selectedRequestedBy || undefined,
        from_stage: selectedStage || undefined,
      });

      const tableData: TableApproval[] = response.data.map((approval) => ({
        key: approval.id,
        id: approval.id,
        requestDetails: {
          name: approval.rule_name || `Rule ${approval.rule_id}`,
          transition: `${approval.from_stage} → ${approval.to_stage}`,
        },
        version: `${approval.version_major || 0}.${approval.version_minor || 1}`,
        requestedBy: approval.requested_by_name || approval.requested_by,
        requestedAt: new Date(approval.requested_at).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        requestStatus: approval.status,
        rule_id: approval.rule_id,
      }));

      setApprovals(tableData);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error('Failed to load approvals:', error);
      message.error('Failed to load approvals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRequestStatusColor = (status: ApprovalStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'text-blue-700 bg-blue-100';
      case 'APPROVED':
        return 'text-green-700 bg-green-100';
      case 'REJECTED':
        return 'text-red-700 bg-red-100';
      case 'WITHDRAWN':
        return 'text-gray-700 bg-gray-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const columns: ColumnsType<TableApproval> = [
    {
      title: <span className="font-semibold text-gray-600">ID</span>,
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (_: string, __: TableApproval, index: number) => (
        <span className="text-gray-700">{(currentPage - 1) * pageSize + index + 1}</span>
      ),
    },
    {
      title: <span className="font-semibold text-gray-600">Request Details</span>,
      key: 'requestDetails',
      width: 300,
      render: (_, record) => (
        <div>
          <div className="font-medium text-gray-900">{record.requestDetails.name}</div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <span>{record.requestDetails.transition}</span>
          </div>
        </div>
      ),
    },
    {
      title: <span className="font-semibold text-gray-600">Version</span>,
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (version: string) => <span className="text-gray-700">{version}</span>,
    },
    {
      title: <span className="font-semibold text-gray-600">Requested By</span>,
      dataIndex: 'requestedBy',
      key: 'requestedBy',
      width: 150,
      render: (requestedBy: string) => <span className="text-gray-700">{requestedBy}</span>,
    },
    {
      title: <span className="font-semibold text-gray-600">Requested At</span>,
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      width: 200,
      render: (requestedAt: string) => <span className="text-gray-700">{requestedAt}</span>,
    },
  ];

  // Add Request Status column only for "All Requests" tab
  if (selectedTab === 'all') {
    columns.push({
      title: <span className="font-semibold text-gray-600">Request Status</span>,
      dataIndex: 'requestStatus',
      key: 'requestStatus',
      width: 130,
      render: (status: ApprovalStatus) => (
        <span className={`px-3 py-1 rounded-md text-sm font-medium ${getRequestStatusColor(status)}`}>
          {status === 'PENDING' ? 'Pending' : status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'Withdrawn'}
        </span>
      ),
    });
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
          <Table
            columns={columns}
            dataSource={approvals}
            pagination={false}
            rowClassName="hover:bg-gray-50/50 cursor-pointer"
            onRow={(record) => ({
              onClick: () => navigate(`/approvals/${record.id}`),
            })}
            locale={{
              emptyText: (
                <div className="py-12 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="w-16 h-16 mx-auto mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-900">No approvals found</p>
                </div>
              ),
            }}
          />
        </Spin>
      </div>

      {/* Custom Pagination - Outside the card */}
      {approvals.length > 0 && (
        <div className="flex justify-end mt-6">
          <Pagination
            current={currentPage}
            total={total}
            pageSize={pageSize}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            className="custom-pagination"
          />
        </div>
      )}
    </>
  );
}
