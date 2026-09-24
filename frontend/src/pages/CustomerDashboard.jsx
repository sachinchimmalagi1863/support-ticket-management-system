import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import TicketList, { TicketFilters } from '../components/TicketList';

export default function CustomerDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });

  useEffect(() => {
    let active = true;
    setLoading(true);

    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;

    api
      .get('/tickets', { params })
      .then((res) => { if (active) setTickets(res.data.tickets); })
      .catch(() => { if (active) setError('Failed to load tickets.'); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [filters]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Tickets</h1>
        <Link to="/tickets/new" className="btn">+ New Ticket</Link>
      </div>
      <TicketFilters filters={filters} onChange={setFilters} />
      {error && <div className="alert alert-error">{error}</div>}
      <TicketList tickets={tickets} loading={loading} />
    </div>
  );
}
