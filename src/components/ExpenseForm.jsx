import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, MONTH_NAMES } from '../utils/demoData';
import { PlusCircle, Edit3, Trash2, Search, Filter } from 'lucide-react';

export default function ExpenseForm() {
  const { state, dispatch } = useApp();
  const { expenses } = state;

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const [formData, setFormData] = useState({
    name: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0], note: '',
  });

  const now = new Date();

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .filter(e => {
        if (searchTerm && !e.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterCategory !== 'all' && e.category !== filterCategory) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, searchTerm, filterCategory]);

  const totalShown = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    const expense = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: new Date(formData.date).toISOString(),
      note: formData.note,
    };

    if (editId) {
      dispatch({ type: 'UPDATE_EXPENSE', payload: { ...expense, id: editId } });
      setEditId(null);
    } else {
      dispatch({ type: 'ADD_EXPENSE', payload: expense });
    }

    setFormData({ name: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0], note: '' });
    setShowForm(false);
  };

  const handleEdit = (exp) => {
    setFormData({
      name: exp.name,
      amount: exp.amount.toString(),
      category: exp.category,
      date: new Date(exp.date).toISOString().split('T')[0],
      note: exp.note || '',
    });
    setEditId(exp.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this expense?')) {
      dispatch({ type: 'DELETE_EXPENSE', payload: id });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h2>Expenses</h2>
            <p className="subtitle">{MONTH_NAMES[now.getMonth()]} {now.getFullYear()} — Manage your expenses</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); setFormData({ name: '', amount: '', category: 'food', date: new Date().toISOString().split('T')[0], note: '' }); }}>
            <PlusCircle size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editId ? 'Edit Expense' : 'Add New Expense'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Expense Name / Merchant</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g., Swiggy, Amazon, Nike Store"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount (₹)</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="0"
                      min="1"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Note (optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Add a note..."
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary + Filters */}
      <div className="card mb-2">
        <div className="flex justify-between items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Showing {filteredExpenses.length} transactions • Total:
            </span>
            <span style={{ fontSize: 18, fontWeight: 700, marginLeft: 8, fontFamily: "'Space Grotesk'" }}>
              ₹{totalShown.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex gap-1">
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                placeholder="Search..."
                style={{ paddingLeft: 32, maxWidth: 200 }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              style={{ maxWidth: 160 }}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="card">
        {filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h4>No expenses found</h4>
            <p className="text-muted mt-1">Add your first expense or adjust filters.</p>
          </div>
        ) : (
          <ul className="expense-list">
            {filteredExpenses.map(exp => {
              const cat = CATEGORIES.find(c => c.id === exp.category);
              return (
                <li key={exp.id} className="expense-item">
                  <div className="expense-cat-icon" style={{ background: `${cat?.color}20` }}>
                    {cat?.icon}
                  </div>
                  <div className="expense-info">
                    <div className="expense-name">{exp.name}</div>
                    <div className="expense-meta">
                      <span>{cat?.name}</span>
                      <span>{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {exp.note && <span style={{ fontStyle: 'italic' }}>"{exp.note}"</span>}
                    </div>
                  </div>
                  <div className="expense-amount" style={{ color: 'var(--danger)' }}>
                    -₹{exp.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="expense-actions">
                    <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(exp)} title="Edit">
                      <Edit3 size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(exp.id)} title="Delete" style={{ color: 'var(--danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
