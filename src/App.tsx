import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RulesPage from './pages/rules';
import RuleCreatePage from './pages/rules/create';
import ApprovalsPage from './pages/approvals';
import MappingsPage from './pages/mappings';
import AuditPage from './pages/audit';
import UsersPage from './pages/users';
import { SidebarProvider } from './context/SidebarContext';

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/rules" replace />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/rule/create/:ruleId" element={<RuleCreatePage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/mapping" element={<MappingsPage />} />
        <Route path="/history" element={<AuditPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Routes>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;
