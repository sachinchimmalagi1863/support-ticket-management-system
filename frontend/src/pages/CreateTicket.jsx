import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function CreateTicket() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!subject.trim() || !description.trim()) {
      setError('Subject and description are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/tickets', { subject, description, priority });
      navigate(`/tickets/${res.data.ticket.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>New Ticket</h1>
      <form className="ticket-form" onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}
        <label>
          Subject
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={200} />
        </label>
        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label>
          Description
          <textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} required />
        </label>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Create Ticket'}
        </button>
      </form>
    </div>
  );
}
