import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useSidebar } from '../../context/SidebarContext'
import { useAuth } from '../../context/AuthContext'

interface LayoutProps {
  children: ReactNode
  showSidebar?: boolean
}

export default function Layout({ children, showSidebar = true }: LayoutProps) {
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    // All paths should now start with /
    if (path.startsWith('/')) {
      navigate(path);
    } else {
      navigate(`/${path}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!showSidebar) {
    return <div className="min-h-screen">{children}</div>
  }

  // Get user display info
  const userName = user ? `${user.first_name} ${user.last_name}` : 'Guest';
  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Sidebar
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        userName={userName}
        userEmail={userEmail}
      />
      <main
        className="transition-all duration-300 min-h-screen bg-gray-50 w-full"
        style={{ marginLeft: isSidebarCollapsed ? '80px' : '256px', width: isSidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 256px)' }}
      >
        {children}
      </main>
    </div>
  )
}
