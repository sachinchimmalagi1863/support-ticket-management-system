import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import AgentDashboard from './pages/AgentDashboard';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import { useAuth } from './context/AuthContext';

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'agent' ? <AgentDashboard /> : <CustomerDashboard />;
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route
            path="/tickets/new"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CreateTicket />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <TicketDetail />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<div className="page"><p>Page not found.</p></div>} />
        </Routes>
      </main>
    </div>
  );
}