import { useState } from 'react';
import { Menu, Tooltip, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import {
    FileTextOutlined,
    CheckCircleOutlined,
    NodeIndexOutlined,
    HistoryOutlined,
    TeamOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined
} from '@ant-design/icons';
import { LogOut } from 'lucide-react';
import logoImage from '@/assets/images/logo.png';

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
    {
        key: 'rules',
        icon: <FileTextOutlined className="text-lg" />,
        label: 'Rules',
    },
    {
        key: 'approvals',
        icon: <CheckCircleOutlined className="text-lg" />,
        label: 'Approvals',
    },
    {
        key: '/mapping',
        icon: <NodeIndexOutlined className="text-lg" />,
        label: 'Mapping',
    },
    {
        key: '/history',
        icon: <HistoryOutlined className="text-lg" />,
        label: 'History',
    },
    {
        key: '/users',
        icon: <TeamOutlined className="text-lg" />,
        label: 'Users',
    },
];

interface SidebarProps {
    currentPath?: string;
    onNavigate?: (path: string) => void;
    userName?: string;
    userEmail?: string;
    userAvatar?: string;
    onLogout?: () => void;
    onCollapse?: (collapsed: boolean) => void;
}

export default function Sidebar({
    currentPath = 'rules',
    onNavigate,
    userName = 'John Doe',
    userEmail = 'john.doe@example.com',
    userAvatar,
    onLogout,
    onCollapse
}: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [selectedKey, setSelectedKey] = useState(currentPath);

    const handleToggleCollapse = () => {
        const newCollapsedState = !isCollapsed;
        setIsCollapsed(newCollapsedState);
        if (onCollapse) {
            onCollapse(newCollapsedState);
        }
    };

    const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
        setSelectedKey(key);
        if (onNavigate) {
            onNavigate(key);
        }
    };

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            // Default logout behavior
            window.location.href = '/login';
        }
    };

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-20 ${isCollapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Logo Header with Collapse Button */}
            <div className={`py-6 flex items-center border-b border-gray-200 bg-white ${isCollapsed ? 'px-3 flex-col gap-2' : 'px-5 gap-3'}`}>
                {isCollapsed ? (
                    <>
                        {/* Collapse Toggle Button - Top when collapsed */}
                        <Tooltip title="Expand" placement="right">
                            <button
                                onClick={handleToggleCollapse}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <MenuUnfoldOutlined className="text-base" />
                            </button>
                        </Tooltip>
                        {/* Logo - Bottom when collapsed */}
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img
                                src={logoImage}
                                alt="Logo"
                                className="w-10 h-10 object-contain"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                            <img
                                src={logoImage}
                                alt="Logo"
                                className="w-10 h-10 object-contain"
                            />
                        </div>
                        <div className="overflow-hidden flex-1">
                            <h1 className="text-xs font-bold text-gray-900 whitespace-nowrap">Rules Configuration</h1>
                            <h1 className="text-xs font-bold text-gray-900 whitespace-nowrap">Engine</h1>
                        </div>
                        {/* Collapse Toggle Button */}
                        <Tooltip title="Collapse" placement="right">
                            <button
                                onClick={handleToggleCollapse}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            >
                                <MenuFoldOutlined className="text-base" />
                            </button>
                        </Tooltip>
                    </>
                )}
            </div>

            {/* Menu Label */}
            {!isCollapsed && (
                <div className="px-6 pt-6 pb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Menu
                    </p>
                </div>
            )}

            {/* Navigation Menu */}
            <nav className={`flex-1 py-2 ${isCollapsed ? 'px-0' : 'px-3'}`}>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    onClick={handleMenuClick}
                    items={menuItems}
                    inlineCollapsed={isCollapsed}
                    className="border-none bg-transparent sidebar-menu"
                    style={{ borderInlineEnd: 'none' }}
                />
            </nav>

            {/* User Profile Section */}
            <div className={`px-4 py-5 border-gray-200 bg-white ${isCollapsed ? 'px-2' : ''}`}>
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                    {/* Profile Avatar */}
                    <Tooltip title={isCollapsed ? userName : ''} placement="right">
                        <Avatar
                            size={40}
                            src={userAvatar}
                            icon={!userAvatar && <UserOutlined />}
                            className="flex-shrink-0 bg-gradient-to-br from-red-600 to-red-500 cursor-pointer"
                        />
                    </Tooltip>

                    {/* User Info */}
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                        </div>
                    )}

                    {/* Logout Button */}
                    {!isCollapsed && (
                        <Tooltip title="Logout" placement="top">
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </Tooltip>
                    )}
                </div>

                {/* Logout button when collapsed */}
                {isCollapsed && (
                    <Tooltip title="Logout" placement="right">
                        <button
                            onClick={handleLogout}
                            className="w-full mt-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex items-center justify-center"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </Tooltip>
                )}
            </div>
        </aside>
    );
}

