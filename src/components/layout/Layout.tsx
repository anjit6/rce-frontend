import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useSidebar } from '../../context/SidebarContext'

interface LayoutProps {
  children: ReactNode
  showSidebar?: boolean
}

export default function Layout({ children, showSidebar = true }: LayoutProps) {
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    // All paths should now start with /
    if (path.startsWith('/')) {
      navigate(path);
    } else {
      navigate(`/${path}`);
    }
  };

  if (!showSidebar) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Sidebar onNavigate={handleNavigate} />
      <main
        className="transition-all duration-300 min-h-screen bg-gray-50 w-full"
        style={{ marginLeft: isSidebarCollapsed ? '80px' : '256px', width: isSidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 256px)' }}
      >
        {children}
      </main>
    </div>
  )
}
