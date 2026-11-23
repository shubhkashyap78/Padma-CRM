import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leads from './pages/Leads.jsx';
import Bookings from './pages/Bookings.jsx';
import Payments from './pages/Payments.jsx';
import Quotations from './pages/Quotations.jsx';
import Staff from './pages/Staff.jsx';
import Account from './pages/Account.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <Layout>
              <Leads />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <Layout>
              <Bookings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <Layout>
              <Payments />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quotations"
        element={
          <ProtectedRoute>
            <Layout>
              <Quotations />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Layout>
              <Account />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route
        path="/staff"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <Staff />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
