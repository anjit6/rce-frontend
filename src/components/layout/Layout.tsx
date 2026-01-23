import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useSidebar } from '../../context/SidebarContext'

interface LayoutProps {
  children: ReactNode
  showSidebar?: boolean
}

export default function Layout({ children, showSidebar = true }: LayoutProps) {
  const { isCollapsed: isSidebarCollapsed, setIsCollapsed: setIsSidebarCollapsed } = useSidebar();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    // Handle both relative and absolute paths
    if (path === 'rules') {
      navigate('/rules');
    } else if (path === 'approvals') {
      navigate('/approvals');
    } else if (path.startsWith('/')) {
      // Already has leading slash
      navigate(path);
    } else {
      // Add leading slash if missing
      navigate(`/${path}`);
    }
  };

  if (!showSidebar) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Sidebar onCollapse={setIsSidebarCollapsed} onNavigate={handleNavigate} />
      <main className={`transition-all duration-300 min-h-screen bg-gray-50 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {children}
      </main>
    </div>
  )
}
