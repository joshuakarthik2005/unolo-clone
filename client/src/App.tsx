import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardHome from './pages/DashboardHome';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import LiveTrackingPage from './pages/LiveTrackingPage';
import AttendanceDashboard from './pages/AttendanceDashboard';
import LeaveManagement from './pages/LeaveManagement';
import TasksPage from './pages/TasksPage';
import TaskDetail from './pages/TaskDetail';
import ExpensesPage from './pages/ExpensesPage';
import ClientsPage from './pages/ClientsPage';
import ProjectsPage from './pages/ProjectsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Guest routes — redirect to dashboard if already authenticated */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected routes — require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/dashboard/employees" element={<EmployeesPage />} />
              <Route path="/dashboard/employees/:id" element={<EmployeeProfilePage />} />
              <Route path="/dashboard/attendance" element={<AttendanceDashboard />} />
              <Route path="/dashboard/leaves" element={<LeaveManagement />} />
              <Route path="/dashboard/tasks" element={<TasksPage />} />
              <Route path="/dashboard/tasks/:id" element={<TaskDetail />} />
              <Route path="/dashboard/expenses" element={<ExpensesPage />} />
              <Route path="/dashboard/clients" element={<ClientsPage />} />                <Route path="/dashboard/projects" element={<ProjectsPage />} />              <Route path="/dashboard/tracking" element={<LiveTrackingPage />} />
              <Route path="/dashboard/shifts" element={<PlaceholderPage title="Shifts" />} />
              <Route path="/dashboard/reports" element={<ReportsPage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
