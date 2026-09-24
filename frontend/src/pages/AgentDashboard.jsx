import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import TicketList, { TicketFilters } from '../components/TicketList';

export default function AgentDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });
  const [sort, setSort] = useState({ sort: 'created_at', order: 'desc' });

  useEffect(() => {
    let active = true;
    setLoading(true);

    const params = { ...sort };
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;

    api
      .get('/tickets', { params })
      .then((res) => { if (active) setTickets(res.data.tickets); })
      .catch(() => { if (active) setError('Failed to load tickets.'); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [filters, sort]);

  const stats = useMemo(() => {
    const base = { open: 0, in_progress: 0, resolved: 0, closed: 0, total: tickets.length };
    tickets.forEach((t) => { base[t.status] = (base[t.status] || 0) + 1; });
    return base;
  }, [tickets]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Agent Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><span className="stat-number">{stats.total}</span><span>Total</span></div>
        <div className="stat-card"><span className="stat-number">{stats.open}</span><span>Open</span></div>
        <div className="stat-card"><span className="stat-number">{stats.in_progress}</span><span>In Progress</span></div>
        <div className="stat-card"><span className="stat-number">{stats.resolved}</span><span>Resolved</span></div>
        <div className="stat-card"><span className="stat-number">{stats.closed}</span><span>Closed</span></div>
      </div>

      <div className="filters-row">
        <TicketFilters filters={filters} onChange={setFilters} />
        <select
          value={`${sort.sort}-${sort.order}`}
          onChange={(e) => {
            const [sortField, order] = e.target.value.split('-');
            setSort({ sort: sortField, order });
          }}
        >
          <option value="created_at-desc">Newest first</option>
          <option value="created_at-asc">Oldest first</option>
          <option value="priority-desc">Priority (high-low)</option>
          <option value="priority-asc">Priority (low-high)</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      <TicketList tickets={tickets} loading={loading} showCustomer />
    </div>
  );
}
