import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layouts and Components
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLocations from './pages/admin/AdminLocations';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminRates from './pages/admin/AdminRates';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const { loading } = useAuth();

  if (loading) {
    console.log("Still loading...");
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>      
    );
  }

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        
        {/* Admin Routes */}
        <Route path="admin" element={<ProtectedRoute allowedRole="admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="locations" element={<AdminLocations />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="rates" element={<AdminRates />} />
        </Route>
        
        {/* Employee Routes */}
        <Route path="employee" element={<ProtectedRoute allowedRole="employee" />}>
          <Route index element={<EmployeeDashboard />} />
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;