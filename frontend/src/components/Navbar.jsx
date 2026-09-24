import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🎫 Support Desk</Link>
      <div className="navbar-links">
        {user ? (
          <>
            <span className="navbar-user">
              {user.name} <span className="badge">{user.role}</span>
            </span>
            {user.role === 'customer' && (
              <Link to="/tickets/new" className="btn btn-sm">New Ticket</Link>
            )}
            <button className="btn btn-sm btn-outline" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn btn-sm">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
