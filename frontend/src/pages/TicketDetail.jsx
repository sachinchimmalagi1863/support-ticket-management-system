import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  async function loadTicket() {
    setLoading(true);
    setError('');
    try {
      const [ticketRes, commentsRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/comments`),
      ]);
      setTicket(ticketRes.data.ticket);
      setComments(commentsRes.data.comments);

      if (user.role === 'agent') {
        const agentsRes = await api.get('/users', { params: { role: 'agent' } });
        setAgents(agentsRes.data.users);
      }
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
      else setError(err.response?.data?.error || 'Failed to load ticket.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTicket(); /* eslint-disable-next-line */ }, [id]);

  async function handleFieldUpdate(field, value) {
    try {
      const res = await api.put(`/tickets/${id}`, { [field]: value });
      setTicket(res.data.ticket);
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed.');
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/tickets/${id}/comments`, { comment: newComment });
      setComments((prev) => [...prev, res.data.comment]);
      setNewComment('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add comment.');
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    try {
      await api.delete(`/tickets/${id}`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete ticket.');
    }
  }

  if (loading) return <div className="page"><p>Loading ticket...</p></div>;
  if (notFound) return <div className="page"><p>Ticket not found.</p></div>;
  if (!ticket) return <div className="page"><p>{error}</p></div>;

  const isAgent = user.role === 'agent';

  return (
    <div className="page">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="ticket-detail-header">
        <h1>#{ticket.id} — {ticket.subject}</h1>
        <button className="btn btn-outline btn-sm" onClick={handleDelete}>Delete</button>
      </div>

      <div className="ticket-meta">
        <div>
          <label>Status</label>
          {isAgent ? (
            <select value={ticket.status} onChange={(e) => handleFieldUpdate('status', e.target.value)}>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          ) : (
            <span className="badge">{ticket.status.replace('_', ' ')}</span>
          )}
        </div>
        <div>
          <label>Priority</label>
          {isAgent ? (
            <select value={ticket.priority} onChange={(e) => handleFieldUpdate('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          ) : (
            <span className="badge">{ticket.priority}</span>
          )}
        </div>
        {isAgent && (
          <div>
            <label>Assigned to</label>
            <select
              value={ticket.assigned_to || ''}
              onChange={(e) => handleFieldUpdate('assigned_to', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label>Customer</label>
          <span>{ticket.customer_name} ({ticket.customer_email})</span>
        </div>
      </div>

      <div className="ticket-description-block">
        <h3>Description</h3>
        <p>{ticket.description}</p>
      </div>

      <div className="comments-section">
        <h3>Comments</h3>
        {comments.length === 0 && <p className="empty-state">No comments yet.</p>}
        {comments.map((c) => (
          <div key={c.id} className="comment">
            <div className="comment-header">
              <strong>{c.author_name}</strong>
              <span className="badge">{c.author_role}</span>
              <span className="comment-date">{new Date(c.created_at).toLocaleString()}</span>
            </div>
            <p>{c.comment}</p>
          </div>
        ))}

        <form className="comment-form" onSubmit={handleAddComment}>
          <textarea
            rows={3}
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button className="btn" type="submit">Post Comment</button>
        </form>
      </div>
    </div>
  );
}
