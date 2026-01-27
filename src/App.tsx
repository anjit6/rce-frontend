import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RulesPage from './pages/rules';
import RuleCreatePage from './pages/rules/create';
import ApprovalsPage from './pages/approvals';
import ApprovalDetailPage from './pages/approvals/detail';
import MappingsPage from './pages/mappings';
import AuditPage from './pages/audit';
import UsersPage from './pages/users';
import LoginPage from './pages/login';
import { SidebarProvider } from './context/SidebarContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route path="/" element={<Navigate to="/rules" replace />} />
            <Route path="/rules" element={
              <ProtectedRoute>
                <RulesPage />
              </ProtectedRoute>
            } />
            <Route path="/rule/create/:ruleId" element={
              <ProtectedRoute>
                <RuleCreatePage />
              </ProtectedRoute>
            } />
            <Route path="/approvals" element={
              <ProtectedRoute>
                <ApprovalsPage />
              </ProtectedRoute>
            } />
            <Route path="/approvals/:id" element={<ApprovalDetailPage />} />
            <Route path="/mapping" element={
              <ProtectedRoute>
                <MappingsPage />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <AuditPage />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            } />
          </Routes>
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
