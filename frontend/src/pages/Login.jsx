import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-split">
      <div className="login-visual">
        <img
          className="login-visual-photo"
          src="/login-illustration.png"
          alt="Support Desk"
        />
      </div>

      <div className="login-form-side">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-brand">
            <svg
              className="login-brand-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 13a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2h-1v-7h3M4 13v7h3v-7H4M4 13a8 8 0 0 1 16 0"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="21" r="1.4" fill="currentColor" />
            </svg>
            <span className="login-brand-text">SUPPORT DESK</span>
          </div>

          <h1 className="login-heading">Log in</h1>
          <p className="login-subheading">Welcome back — pick up right where you left off.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          <button className="btn login-submit" type="submit" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Log in'}
          </button>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}