import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

// Admin Pages
import DashboardOverview from './pages/admin/DashboardOverview';
import ParticipantList from './pages/admin/ParticipantList';
import ParticipantDetail from './pages/admin/ParticipantDetail';
import DocumentMonitoring from './pages/admin/DocumentMonitoring';
import AttendanceImport from './pages/admin/AttendanceImport';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

// Guards
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
          </Route>

          {/* Admin Login */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="participants" element={<ParticipantList />} />
            <Route path="participants/:id" element={<ParticipantDetail />} />
            <Route path="documents" element={<DocumentMonitoring />} />
            <Route path="attendance-import" element={<AttendanceImport />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DataProvider>
    </AuthProvider>
  );
}
