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
import { PERMISSIONS, PERMISSION_GROUPS } from './constants/permissions';

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
              <ProtectedRoute requiredPermissions={PERMISSION_GROUPS.VIEW_RULES}>
                <RulesPage />
              </ProtectedRoute>
            } />
            <Route path="/rule/create/:ruleId" element={
              <ProtectedRoute requiredPermissions={[PERMISSIONS.CREATE_RULE, PERMISSIONS.EDIT_RULE]}>
                <RuleCreatePage />
              </ProtectedRoute>
            } />
            <Route path="/approvals" element={
              <ProtectedRoute requiredPermissions={PERMISSION_GROUPS.VIEW_APPROVALS}>
                <ApprovalsPage />
              </ProtectedRoute>
            } />
            <Route path="/approvals/:id" element={
              <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_APPROVAL_REQUEST_DETAILS]}>
                <ApprovalDetailPage />
              </ProtectedRoute>
            } />
            <Route path="/mapping" element={
              <ProtectedRoute requiredPermissions={PERMISSION_GROUPS.VIEW_RULES}>
                <MappingsPage />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute requiredPermissions={PERMISSION_GROUPS.VIEW_RULES}>
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
