import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Dropdown, Space, Pagination, Tooltip, message, Spin } from 'antd';
import { SearchOutlined, FilterOutlined, DownOutlined, PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import CreateRuleModal from './CreateRuleModal';
import { rulesService } from '../../services/rules.service';
import { Input } from '../ui/input';

// Type definitions for table display
interface TableRule {
    key: string;
    id: number;
    name: string;
    description: string;
    version: string;
    author: string;
    status: 'WIP' | 'TEST' | 'PENDING' | 'PROD';
    mappingCount: number;
    type: 'static' | 'dynamic';
}

export default function RulesList() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRuleType, setSelectedRuleType] = useState<'static' | 'dynamic' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rules, setRules] = useState<TableRule[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<'WIP' | 'TEST' | 'PENDING' | 'PROD' | null>(null);
    const [totalRules, setTotalRules] = useState(0);
    const pageSize = 10;

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchInput]);

    // Load rules from API when search query, status filter, or page changes
    useEffect(() => {
        loadRules();
    }, [searchQuery, selectedStatus, currentPage]);

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedStatus]);

    // Reload rules when window gets focus (user returns from create page)
    useEffect(() => {
        const handleFocus = () => loadRules();
        window.addEventListener('focus', handleFocus);

        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const loadRules = async () => {
        try {
            setLoading(true);
            // Server-side pagination: send current page and limit to API
            const { rules: rulesData, total } = await rulesService.getRules(currentPage, pageSize, searchQuery || undefined, selectedStatus || undefined);
            const tableRules: TableRule[] = rulesData.map(rule => ({
                key: rule.id.toString(),
                id: rule.id,
                name: rule.name,
                description: rule.description,
                version: `${rule.version.major}.${rule.version.minor}`,
                author: rule.author || 'Unknown',
                status: rule.status,
                mappingCount: rule.mappingCount,
                type: rule.type
            }));
            setRules(tableRules);
            setTotalRules(total);
        } catch (error) {
            console.error('Failed to load rules:', error);
            message.error('Failed to load rules. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Dropdown menu items
    const createRuleMenuItems: MenuProps['items'] = [
        {
            key: 'static',
            label: (
                <div className="py-2">
                    <div className="font-medium text-gray-900">Data Transformation</div>
                    <div className="text-sm text-gray-500">Simple to complex text manipulation.</div>
                </div>
            ),
        },
        {
            key: 'dynamic',
            label: (
                <div className="py-2">
                    <div className="font-medium text-gray-900">Data Processing</div>
                    <div className="text-sm text-gray-500">Write custom JavaScript functions using inbuilt SDK</div>
                </div>
            ),
        },
    ];

    const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
        setSelectedRuleType(key as 'static' | 'dynamic');
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedRuleType(null);
    };

    const handleRuleCreate = async (data: { name: string; description: string }) => {
        if (selectedRuleType) {
            try {
                setCreating(true);
                // Create rule via API
                const newRule = await rulesService.addRule({
                    name: data.name,
                    description: data.description,
                    type: selectedRuleType,
                    author: ''
                });

                message.success('Rule created successfully!');

                // Reload rules list
                await loadRules();

                // Close modal and reset state
                setIsModalOpen(false);
                setSelectedRuleType(null);

                // Navigate to the rule configuration page with state indicating it's a new rule
                navigate(`/rule/create/${newRule.id}`, { state: { isNewRule: true } });
            } catch (error: any) {
                console.error('Failed to create rule:', error);
                const errorMessage = error?.response?.data?.error || 'Failed to create rule. Please try again.';
                message.error(errorMessage);
            } finally {
                setCreating(false);
            }
        }
    };

    // Table columns definition
    const columns: ColumnsType<TableRule> = [
        {
            title: <span className="font-bold">ID</span>,
            dataIndex: 'id',
            key: 'id',
            width: 120,
            render: (id: number) => (
                <Tooltip title={`Rule ID: ${id}`}>
                    <span className="text-gray-500">{id}</span>
                </Tooltip>
            ),
        },
        {
            title: <span className="font-bold">Rule Name & Description</span>,
            key: 'name',
            width: 280,
            render: (_, record) => (
                <Tooltip title={
                    <div>
                        <div className="font-medium">{record.name}</div>
                        <div className="text-xs mt-1">{record.description}</div>
                    </div>
                }>
                    <div className="max-w-[250px]">
                        <div className="font-medium text-gray-900 hover:text-red-600 cursor-pointer transition-colors truncate">
                            {record.name}
                        </div>
                        <div className="text-sm text-gray-400 truncate">
                            {record.description}
                        </div>
                    </div>
                </Tooltip>
            ),
        },
        {
            title: <span className="font-bold">Version</span>,
            dataIndex: 'version',
            key: 'version',
            width: 100,
            render: (version: string) => (
                <Tooltip title={`Version: ${version}`}>
                    <span className="text-gray-700">{version}</span>
                </Tooltip>
            ),
        },
        {
            title: <span className="font-bold">Author</span>,
            dataIndex: 'author',
            key: 'author',
            width: 150,
            render: (author: string) => (
                <Tooltip title={`Author: ${author}`}>
                    <span className="text-gray-700">{author}</span>
                </Tooltip>
            ),
        },
        {
            title: <span className="font-bold">Status</span>,
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: TableRule['status']) => (
                <Tooltip title={`Status: ${status}`}>
                    <span className="text-gray-900 font-medium">{status}</span>
                </Tooltip>
            ),
        },
        {
            title: <span className="font-bold">Mapping</span>,
            dataIndex: 'mappingCount',
            key: 'mappingCount',
            width: 100,
            render: (count: number) => (
                <Tooltip title={`${count} mapping${count !== 1 ? 's' : ''}`}>
                    <span className={count > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                        {count}
                    </span>
                </Tooltip>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="px-8 py-6">
                <h1 className="text-xl font-semibold text-gray-900">All Rules</h1>
            </div>

            {/* Search and Actions Bar */}
            <div className="px-8 pb-6">
                <div className="flex items-center justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative" style={{ width: '22rem' }}>
                        <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                        <Input
                            placeholder="Search by Rule ID, Name and Description"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-10 rounded-lg"
                        />
                    </div>

                    <Space size="middle">
                        {/* Status Filter Dropdown */}
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 'all',
                                        label: (
                                            <div className="px-2 py-1">
                                                <span className="text-gray-700">All Status</span>
                                            </div>
                                        ),
                                    },
                                    {
                                        type: 'divider',
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
                                                <span className="text-gray-700">PROD</span>
                                            </div>
                                        ),
                                    },
                                ],
                                onClick: ({ key }) => {
                                    if (key === 'all') {
                                        setSelectedStatus(null);
                                    } else {
                                        setSelectedStatus(key as 'WIP' | 'TEST' | 'PENDING' | 'PROD');
                                    }
                                },
                                className: 'min-w-[140px]'
                            }}
                            trigger={['click']}
                            placement="bottomRight"
                        >
                            <Button
                                icon={<FilterOutlined />}
                                className="rounded-lg border-gray-200 hover:border-red-500 hover:text-gray-900 focus:border-red-500 focus:text-gray-900"
                            >
                                {selectedStatus ? (
                                    <span className="ml-1">
                                        {selectedStatus === 'WIP' ? 'WIP' :
                                            selectedStatus === 'TEST' ? 'TEST' :
                                                selectedStatus === 'PENDING' ? 'PENDING' :
                                                    selectedStatus === 'PROD' ? 'PROD' : ''}
                                    </span>
                                ) : (
                                    <span className="ml-1">Filter</span>
                                )}
                                <DownOutlined className="ml-2 text-xs" />
                            </Button>
                        </Dropdown>

                        {/* Create Rule Dropdown */}
                        <Dropdown
                            menu={{
                                items: createRuleMenuItems,
                                onClick: handleMenuClick,
                                className: 'w-72'
                            }}
                            trigger={['click']}
                            placement="bottomRight"
                        >
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                className="rounded-lg bg-red-600 hover:bg-red-500 focus:bg-red-500 border-none flex items-center"
                            >
                                <span>Create Rule</span>
                                <DownOutlined className="ml-2 text-xs" />
                            </Button>
                        </Dropdown>
                    </Space>
                </div>
            </div>

            {/* Rules Table */}
            <div className="px-8 pb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
                        <Table
                            columns={columns}
                            dataSource={rules}
                            pagination={false}
                            rowClassName="hover:bg-gray-50/50 cursor-pointer"
                            className="rules-table"
                            onRow={(record) => ({
                                onClick: () => navigate(`/rule/create/${record.id}`),
                            })}
                            locale={{
                                emptyText: (
                                    <div className="py-12 text-center">
                                        <div className="text-gray-400 mb-2">
                                            <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-medium text-gray-900">No results found in rules</p>
                                    </div>
                                )
                            }}
                        />
                    </Spin>
                </div>

                {/* Custom Pagination */}
                {rules.length > 0 && (
                    <div className="flex justify-end mt-6">
                        <Pagination
                            current={currentPage}
                            total={totalRules}
                            pageSize={pageSize}
                            onChange={(page) => setCurrentPage(page)}
                            showSizeChanger={false}
                            // showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} rules`}
                            className="custom-pagination"
                        />
                    </div>
                )}
            </div>

            {/* Create Rule Modal */}
            <CreateRuleModal
                isOpen={isModalOpen}
                ruleType={selectedRuleType}
                onClose={handleModalClose}
                onSubmit={handleRuleCreate}
                loading={creating}
            />
        </div>
    );
}
