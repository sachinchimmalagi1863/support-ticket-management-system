import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  open: 'status-open',
  in_progress: 'status-progress',
  resolved: 'status-resolved',
  closed: 'status-closed',
};

const PRIORITY_COLORS = {
  low: 'priority-low',
  medium: 'priority-medium',
  high: 'priority-high',
  urgent: 'priority-urgent',
};

export function TicketFilters({ filters, onChange }) {
  return (
    <div className="filters">
      <input
        type="text"
        placeholder="Search tickets..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
      />
      <select value={filters.status} onChange={(e) => onChange({ ...filters, status: e.target.value })}>
        <option value="">All statuses</option>
        <option value="open">Open</option>
        <option value="in_progress">In progress</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
      <select value={filters.priority} onChange={(e) => onChange({ ...filters, priority: e.target.value })}>
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
    </div>
  );
}

export default function TicketList({ tickets, loading, showCustomer }) {
  if (loading) return <p>Loading tickets...</p>;
  if (!tickets || tickets.length === 0) return <p className="empty-state">No tickets found.</p>;

  return (
    <div className="ticket-list">
      {tickets.map((t) => (
        <Link to={`/tickets/${t.id}`} key={t.id} className="ticket-card">
          <div className="ticket-card-header">
            <span className="ticket-id">#{t.id}</span>
            <span className={`badge ${STATUS_COLORS[t.status]}`}>{t.status.replace('_', ' ')}</span>
            <span className={`badge ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
          </div>
          <h3>{t.subject}</h3>
          <p className="ticket-description">{t.description}</p>
          <div className="ticket-card-footer">
            {showCustomer && <span>{t.customer_name}</span>}
            {t.agent_name && <span>Assigned to {t.agent_name}</span>}
            <span>{new Date(t.created_at).toLocaleString()}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
