import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminRoute from './components/AdminRoute';
import LoadingSpinner from './components/LoadingSpinner';
import SessionManager from './components/SessionManager';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Cities from './pages/Cities';
import Countries from './pages/Countries';
import Categories from './pages/Categories';
import Companies from './pages/Companies';
import Users from './pages/Users';
// import Orders from './pages/Orders';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import InsufficientPermissions from './pages/InsufficientPermissions';
import Slider from './components/Slider';

// Main app content (protected)
const AppContent = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Initializing Admin Panel..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <>
      <SessionManager />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - 264px)` },
            px: { xs: 2, md: 4 },
            py: { xs: 2, md: 3 },
            mt: { xs: '60px', md: '68px' },
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            {/* <Route path="/orders" element={<ErrorBoundary><Orders /></ErrorBoundary>} /> */}
            <Route path="/cities" element={<ErrorBoundary><Cities /></ErrorBoundary>} />
            <Route path="/countries" element={<ErrorBoundary><Countries /></ErrorBoundary>} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/companies" element={<ErrorBoundary><Companies /></ErrorBoundary>} />
            <Route path="/users" element={<Users />} />
            <Route path="/slider" element={<Slider />} />

          </Routes>
        </Box>
      </Box>
    </>
  );
};

// Main app component
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/insufficient-permissions" element={<InsufficientPermissions />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
