import React, { useState, useEffect } from 'react';
import { getSupportTickets, assignTicket, updateTicket, getTicketMessages, sendTicketMessage } from '../services/api';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    loadTickets();
  }, [filters]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages();
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    try {
      const response = await getSupportTickets(filters);
      setTickets(response.data);
    } catch (err) {
      setError('Ошибка загрузки тикетов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedTicket) return;
    try {
      const response = await getTicketMessages(selectedTicket.id);
      setMessages(response.data);
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err);
    }
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setNewMessage('');
  };

  const handleAssign = async () => {
    if (!selectedTicket) return;
    try {
      await assignTicket(selectedTicket.id, 'admin');
      alert('Тикет назначен вам');
      loadTickets();
      setSelectedTicket({ ...selectedTicket, assigned_to: 'admin' });
    } catch (err) {
      setError('Ошибка назначения тикета');
      console.error(err);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedTicket) return;
    try {
      await updateTicket(selectedTicket.id, { status });
      alert(`Статус изменён на: ${status}`);
      loadTickets();
      setSelectedTicket({ ...selectedTicket, status });
    } catch (err) {
      setError('Ошибка обновления статуса');
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      await sendTicketMessage(selectedTicket.id, newMessage);
      setNewMessage('');
      loadMessages();
    } catch (err) {
      setError('Ошибка отправки сообщения');
      console.error(err);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#dc3545'
    };
    return colors[priority] || '#6c757d';
  };

  const getStatusColor = (status) => {
    const colors = {
      open: '#17a2b8',
      in_progress: '#007bff',
      resolved: '#28a745',
      closed: '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Поддержка</h1>

      {error && <div className="error" style={{ marginBottom: '20px' }}>{error}</div>}

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Статус</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">Все</option>
              <option value="open">Открыт</option>
              <option value="in_progress">В работе</option>
              <option value="resolved">Решён</option>
              <option value="closed">Закрыт</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Приоритет</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
            >
              <option value="">Все</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>
          <button
            onClick={() => setFilters({ status: '', priority: '', page: 1, limit: 20 })}
            className="btn btn-secondary"
            style={{ marginTop: '24px' }}
          >
            Сбросить
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 2fr' : '1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Тикеты ({tickets.length})</h3>
          {tickets.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
              Тикеты не найдены
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  style={{
                    padding: '15px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedTicket?.id === ticket.id ? '#e3f2fd' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600' }}>#{ticket.id}</span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: getPriorityColor(ticket.priority) + '20',
                        color: getPriorityColor(ticket.priority)
                      }}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    {ticket.subject}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: getStatusColor(ticket.status) + '20',
                        color: getStatusColor(ticket.status)
                      }}
                    >
                      {ticket.status}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6c757d' }}>
                      {new Date(ticket.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedTicket && (
          <div className="card">
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3>Тикет #{selectedTicket.id}</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {!selectedTicket.assigned_to && (
                    <button onClick={handleAssign} className="btn btn-primary" style={{ fontSize: '14px' }}>
                      Взять в работу
                    </button>
                  )}
                  {selectedTicket.status === 'open' && (
                    <button
                      onClick={() => handleUpdateStatus('in_progress')}
                      className="btn btn-primary"
                      style={{ fontSize: '14px' }}
                    >
                      В работу
                    </button>
                  )}
                  {selectedTicket.status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdateStatus('resolved')}
                      className="btn btn-primary"
                      style={{ fontSize: '14px' }}
                    >
                      Решён
                    </button>
                  )}
                </div>
              </div>

              <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '15px' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px' }}>
                  {selectedTicket.subject}
                </div>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>
                  {selectedTicket.description}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#6c757d' }}>Статус:</span>
                  <div
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: getStatusColor(selectedTicket.status) + '20',
                      color: getStatusColor(selectedTicket.status),
                      display: 'inline-block',
                      marginLeft: '8px'
                    }}
                  >
                    {selectedTicket.status}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#6c757d' }}>Приоритет:</span>
                  <div
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: getPriorityColor(selectedTicket.priority) + '20',
                      color: getPriorityColor(selectedTicket.priority),
                      display: 'inline-block',
                      marginLeft: '8px'
                    }}
                  >
                    {selectedTicket.priority}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #dee2e6', paddingTop: '20px' }}>
              <h4 style={{ marginBottom: '15px' }}>Сообщения</h4>
              <div
                style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  marginBottom: '15px',
                  padding: '10px',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}
              >
                {messages.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#6c757d' }}>Нет сообщений</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        marginBottom: '10px',
                        padding: '10px',
                        background: msg.sender_role === 'admin' ? '#e3f2fd' : 'white',
                        borderRadius: '8px',
                        border: '1px solid #dee2e6'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>
                        {msg.sender_role === 'admin' ? 'Администратор' : 'Пользователь'} •{' '}
                        {new Date(msg.created_at).toLocaleString('ru-RU')}
                      </div>
                      <div style={{ fontSize: '14px' }}>{msg.message}</div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage}>
                <div className="form-group">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    rows="3"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Отправить
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;
