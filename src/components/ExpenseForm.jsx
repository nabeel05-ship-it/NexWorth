import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import LanguageSwitcher from './LanguageSwitcher';
import { CATEGORIES, MONTH_NAMES } from '../utils/demoData';
import { PlusCircle, Edit3, Trash2, Search, Filter, CheckCircle2, ArrowUpDown } from 'lucide-react';

export default function ExpenseForm() {
  const { state, dispatch, t } = useApp();
  const { expenses = [] } = state;

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    note: '',
    paymentMethod: 'UPI',
    source: 'Manual',
  });

  const now = new Date();

  // Distinct months present in expenses
  const availableMonths = useMemo(() => {
    const set = new Set();
    expenses.forEach(e => {
      if (e.date) {
        const d = new Date(e.date);
        if (!isNaN(d.getTime())) {
          set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
      }
    });
    // Ensure current month is always present
    set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => {
        // Month filter
        if (filterMonth !== 'all') {
          const d = new Date(e.date);
          if (isNaN(d.getTime())) return false;
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (monthKey !== filterMonth) return false;
        }

        // Category filter
        if (filterCategory !== 'all') {
          const cat = (e.category || '').toLowerCase();
          if (cat !== filterCategory.toLowerCase()) return false;
        }

        // Payment method filter
        if (filterPayment !== 'all') {
          const pm = (e.paymentMethod || '').toLowerCase();
          const src = (e.source || '').toLowerCase();
          if (filterPayment === 'Cash') {
            if (pm !== 'cash' && src !== 'cash') return false;
          } else if (filterPayment === 'UPI') {
            if (pm !== 'upi') return false;
          } else if (filterPayment === 'Card') {
            if (!pm.includes('card')) return false;
          }
        }

        // Search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const expName = (e.name || e.merchant || '').toLowerCase();
          const expNote = (e.note || '').toLowerCase();
          const expCat = (e.category || '').toLowerCase();
          if (!expName.includes(term) && !expNote.includes(term) && !expCat.includes(term)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [expenses, filterMonth, filterCategory, filterPayment, searchTerm]);

  const totalShown = useMemo(() => {
    return filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const cashTotal = useMemo(() => {
    return filteredExpenses
      .filter(e => (e.paymentMethod || '').toLowerCase() === 'cash' || (e.source || '').toLowerCase() === 'cash')
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const openAddModal = (defaultPayment = 'UPI') => {
    setEditId(null);
    setFormData({
      name: '',
      amount: '',
      category: 'food',
      date: new Date().toISOString().split('T')[0],
      note: '',
      paymentMethod: defaultPayment,
      source: defaultPayment === 'Cash' ? 'Cash' : 'Manual',
    });
    setShowForm(true);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.amount) return;

    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    // Use midday to avoid timezone day shifts
    const safeDate = formData.date
      ? new Date(`${formData.date}T12:00:00`).toISOString()
      : new Date().toISOString();

    const expensePayload = {
      name: formData.name.trim(),
      merchant: formData.name.trim(),
      amount: amountNum,
      category: (formData.category || 'other').toLowerCase(),
      date: safeDate,
      note: formData.note.trim(),
      paymentMethod: formData.paymentMethod || 'UPI',
      source: formData.paymentMethod === 'Cash' ? 'Cash' : (formData.source || 'Manual'),
    };

    if (editId) {
      dispatch({
        type: 'UPDATE_EXPENSE',
        payload: { ...expensePayload, id: editId, _id: editId },
      });
      showToast(`✓ Updated "${expensePayload.name}" (₹${amountNum.toLocaleString('en-IN')})`);
      setEditId(null);
    } else {
      dispatch({
        type: 'ADD_EXPENSE',
        payload: expensePayload,
      });
      showToast(`✓ Added "${expensePayload.name}" (₹${amountNum.toLocaleString('en-IN')}) to expenses!`);
    }

    setShowForm(false);
  };

  const handleEdit = (exp) => {
    const id = exp._id || exp.id;
    let expDate = new Date().toISOString().split('T')[0];
    if (exp.date) {
      try {
        expDate = new Date(exp.date).toISOString().split('T')[0];
      } catch (err) {}
    }

    setFormData({
      name: exp.name || exp.merchant || '',
      amount: (exp.amount || '').toString(),
      category: (exp.category || 'food').toLowerCase(),
      date: expDate,
      note: exp.note || '',
      paymentMethod: exp.paymentMethod || 'UPI',
      source: exp.source || 'Manual',
    });
    setEditId(id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this expense?')) {
      dispatch({ type: 'DELETE_EXPENSE', payload: id });
      showToast('Expense removed.');
    }
  };

  const paymentButtons = [
    { id: 'UPI', label: '📱 UPI (GPay/PhonePe)', source: 'Manual' },
    { id: 'Cash', label: '💵 Cash', source: 'Cash' },
    { id: 'Credit Card', label: '💳 Credit Card', source: 'Manual' },
    { id: 'Debit Card', label: '💳 Debit Card', source: 'Manual' },
    { id: 'NetBanking', label: '🏦 NetBanking', source: 'Manual' },
  ];

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          background: '#1A1714',
          color: '#FFFFFF',
          padding: '14px 22px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid rgba(252, 108, 38, 0.4)',
        }}>
          <CheckCircle2 size={18} color="#22C55E" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2>{t('exp_title')}</h2>
            <p className="subtitle">{t('exp_subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact={false} />
            <button className="btn btn-primary" onClick={() => openAddModal('UPI')}>
              <PlusCircle size={16} /> {t('exp_add_btn')}
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>{editId ? t('exp_edit_modal_title') : t('exp_add_modal_title')}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {t('exp_modal_subtitle')}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Quick Payment Method Pills */}
                <div className="form-group mb-2">
                  <label className="form-label" style={{ marginBottom: 6 }}>{t('exp_payment_label')}</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {paymentButtons.map(pm => {
                      const isActive = formData.paymentMethod === pm.id;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: pm.id, source: pm.source })}
                          style={{
                            padding: '7px 13px',
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: isActive ? 600 : 500,
                            border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: isActive ? 'rgba(252, 108, 38, 0.12)' : 'var(--bg-secondary)',
                            color: isActive ? 'var(--primary)' : 'var(--text)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {pm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('exp_name_label')}</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder={t('exp_name_placeholder')}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('exp_amount_label')}</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="0"
                      min="1"
                      step="any"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('exp_category_label')}</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {t(`cat_${cat.id}`) || cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('exp_date_label')}</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('exp_note_label')}</label>
                  <textarea
                    className="form-textarea"
                    placeholder={t('exp_note_placeholder')}
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                  {t('exp_cancel_btn')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {editId ? t('exp_update_btn') : t('exp_save_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary + Filters Bar */}
      <div className="card mb-2" style={{ background: '#FFFFFF', border: '1px solid var(--border)' }}>
        <div className="flex justify-between items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {t('exp_showing')} {filteredExpenses.length} {t('exp_transactions')}:
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk'", color: 'var(--text)' }}>
                ₹{totalShown.toLocaleString('en-IN')}
              </span>
              {cashTotal > 0 && (
                <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#E6F4EA', color: '#137333', fontWeight: 600 }}>
                  💵 {t('exp_cash_total')}: ₹{cashTotal.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex gap-1" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                placeholder={t('exp_search_placeholder')}
                style={{ paddingLeft: 30, maxWidth: 190, fontSize: 13 }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Month Filter */}
            <select
              className="form-select"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              style={{ maxWidth: 150, fontSize: 13 }}
            >
              <option value="all">{t('exp_filter_month')}</option>
              {availableMonths.map(mKey => {
                const [y, m] = mKey.split('-');
                const monthName = MONTH_NAMES[parseInt(m, 10) - 1] || m;
                return (
                  <option key={mKey} value={mKey}>
                    {monthName} {y}
                  </option>
                );
              })}
            </select>

            {/* Category Filter */}
            <select
              className="form-select"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              style={{ maxWidth: 140, fontSize: 13 }}
            >
              <option value="all">{t('exp_filter_category')}</option>
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {t(`cat_${cat.id}`) || cat.name}</option>
              ))}
            </select>

            {/* Payment Method Filter */}
            <select
              className="form-select"
              value={filterPayment}
              onChange={e => setFilterPayment(e.target.value)}
              style={{ maxWidth: 130, fontSize: 13 }}
            >
              <option value="all">{t('exp_filter_mode')}</option>
              <option value="Cash">💵 {t('pay_cash')}</option>
              <option value="UPI">📱 UPI</option>
              <option value="Card">💳 Card</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="card">
        {filteredExpenses.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div className="empty-icon" style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
            <h4 style={{ margin: '0 0 6px' }}>{t('exp_no_found')}</h4>
            <p className="text-muted mt-1" style={{ fontSize: 13, margin: '0 0 16px' }}>
              {t('exp_no_found_desc')}
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => openAddModal('UPI')}>
              <PlusCircle size={14} /> {t('exp_add_first')}
            </button>
          </div>
        ) : (
          <ul className="expense-list">
            {filteredExpenses.map(exp => {
              const id = exp._id || exp.id;
              const name = exp.name || exp.merchant || 'Expense';
              const catId = (exp.category || 'other').toLowerCase();
              const cat = CATEGORIES.find(c => c.id.toLowerCase() === catId) || {
                id: 'other',
                name: 'Other',
                icon: '📌',
                color: '#A0A0B0',
              };

              const isCash = (exp.paymentMethod || '').toLowerCase() === 'cash' || (exp.source || '').toLowerCase() === 'cash';

              let formattedDate = 'Recent';
              if (exp.date) {
                const d = new Date(exp.date);
                if (!isNaN(d.getTime())) {
                  formattedDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                }
              }

              return (
                <li key={id} className="expense-item">
                  <div className="expense-cat-icon" style={{ background: `${cat.color}20` }}>
                    {cat.icon}
                  </div>

                  <div className="expense-info">
                    <div className="expense-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{name}</span>
                      {isCash ? (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#E6F4EA', color: '#137333', fontWeight: 600 }}>
                          💵 Cash
                        </span>
                      ) : exp.source ? (
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: '#FFF4D6', color: '#D97706', fontWeight: 600 }}>
                          {exp.source.toUpperCase() === 'SMS'
                            ? '💬 SMS'
                            : exp.source.toUpperCase() === 'NOTIFICATION'
                            ? '🔔 Alert'
                            : exp.source.toUpperCase() === 'EMAIL'
                            ? '📧 Email'
                            : exp.paymentMethod || 'UPI'}
                        </span>
                      ) : null}
                    </div>

                    <div className="expense-meta">
                      <span>{cat.name}</span>
                      <span>• {formattedDate}</span>
                      {exp.paymentMethod && !isCash && <span>• {exp.paymentMethod}</span>}
                      {exp.note && <span style={{ fontStyle: 'italic' }}>"{exp.note}"</span>}
                    </div>
                  </div>

                  <div className="expense-amount" style={{ color: 'var(--danger)', fontWeight: 700 }}>
                    -₹{Number(exp.amount || 0).toLocaleString('en-IN')}
                  </div>

                  <div className="expense-actions">
                    <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(exp)} title="Edit">
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => handleDelete(id)}
                      title="Delete"
                      style={{ color: 'var(--danger)' }}
                    >
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
