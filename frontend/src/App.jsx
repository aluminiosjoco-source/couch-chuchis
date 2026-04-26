import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

// Auth
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Pages
import ClientDashboard from './pages/Client/ClientDashboard';
import SubmitCheckIn from './pages/Client/SubmitCheckIn';
import ClientLogin from './pages/Client/ClientLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import WorkoutTracker from './pages/Client/WorkoutTracker';
import RoutineEditor from './pages/Trainer/RoutineEditor';
import ClientProfile from './pages/Trainer/ClientProfile';
import ClientPlanEditor from './pages/Trainer/ClientPlanEditor';
import TrainerDashboard from './pages/TrainerDashboard';
import TrainersPage from './pages/GymOwner/TrainersPage';

// Auth gate
function AuthGate() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-dark)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,90,0,0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return showRegister
      ? <Register onSwitch={() => setShowRegister(false)} />
      : <Login onSwitch={() => setShowRegister(true)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        {/* Redirección inicial por rol */}
        <Route index element={
          user.rol === 'super_admin' ? <Navigate to="/admin" replace />
          : user.rol === 'client' ? <Navigate to="/client" replace />
          : <Navigate to="/trainer" replace />
        } />
        <Route path="trainer" element={<TrainerDashboard />} />
        <Route path="trainer/rutinas" element={<RoutineEditor />} />
        <Route path="trainer/clients/:id" element={<ClientProfile />} />
        <Route path="trainer/clients/:id/plan" element={<ClientPlanEditor />} />
        <Route path="trainer/entrenadores" element={<TrainersPage />} />
        
        {/* Client Routes */}
        <Route path="client" element={<ClientDashboard />} />
        <Route path="client/workout" element={<WorkoutTracker />} />
        <Route path="client/checkin" element={<SubmitCheckIn />} />
        
        <Route path="admin" element={<SuperAdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
