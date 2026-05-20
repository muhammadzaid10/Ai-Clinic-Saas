import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffPage from './pages/admin/StaffPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import SubscriptionsPage from './pages/admin/SubscriptionsPage';

// Doctor / Receptionist / Patient
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AIAssistantPage from './pages/doctor/AIAssistantPage';
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import PatientDashboard from './pages/patient/PatientDashboard';

// Shared pages
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import AppointmentsPage from './pages/AppointmentsPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import PrescriptionDetailPage from './pages/PrescriptionDetailPage';

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !user.role) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/staff" element={<StaffPage />} />
        <Route path="/admin/patients" element={<PatientsPage />} />
        <Route path="/admin/patients/:id" element={<PatientDetailPage />} />
        <Route path="/admin/appointments" element={<AppointmentsPage />} />
        <Route path="/admin/prescriptions" element={<PrescriptionsPage />} />
        <Route path="/admin/prescriptions/:id" element={<PrescriptionDetailPage />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/subscriptions" element={<SubscriptionsPage />} />
      </Route>

      {/* Doctor */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/doctor/patients" element={<PatientsPage />} />
        <Route path="/doctor/patients/:id" element={<PatientDetailPage />} />
        <Route path="/doctor/appointments" element={<AppointmentsPage />} />
        <Route path="/doctor/prescriptions" element={<PrescriptionsPage />} />
        <Route path="/doctor/prescriptions/:id" element={<PrescriptionDetailPage />} />
        <Route path="/doctor/ai-assistant" element={<AIAssistantPage />} />
      </Route>

      {/* Receptionist */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/receptionist" element={<ReceptionistDashboard />} />
        <Route path="/receptionist/patients" element={<PatientsPage />} />
        <Route path="/receptionist/patients/:id" element={<PatientDetailPage />} />
        <Route path="/receptionist/appointments" element={<AppointmentsPage />} />
      </Route>

      {/* Patient */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/patient/appointments" element={<AppointmentsPage />} />
        <Route path="/patient/prescriptions" element={<PrescriptionsPage />} />
        <Route path="/patient/prescriptions/:id" element={<PrescriptionDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
