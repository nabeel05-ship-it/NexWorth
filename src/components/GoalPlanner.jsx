import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Target, Plus, Edit3, Trash2, Calendar } from 'lucide-react';

const GOAL_ICONS = ['💻', '✈️', '🛡️', '📚', '🏠', '🚗', '💍', '📱', '🎓', '🏖️', '💰', '🎯'];

export default function GoalPlanner() {
  const { state, dispatch } = useApp();
  const { goals } = state;

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', targetAmount: '', currentAmount: '', targetDate: '', icon: '🎯',
  });

  const now = new Date();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) return;

    const goal = {
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
      targetDate: formData.targetDate ? new Date(formData.targetDate).toISOString() : new Date(now.getFullYear() + 1, now.getMonth(), 1).toISOString(),
      icon: formData.icon,
    };

    if (editId) {
      dispatch({ type: 'UPDATE_GOAL', payload: { ...goal, id: editId } });
      setEditId(null);
    } else {
      dispatch({ type: 'ADD_GOAL', payload: goal });
    }

    setFormData({ name: '', targetAmount: '', currentAmount: '', targetDate: '', icon: '🎯' });
    setShowForm(false);
  };

  const handleEdit = (goal) => {
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: new Date(goal.targetDate).toISOString().split('T')[0],
      icon: goal.icon,
    });
    setEditId(goal.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this goal?')) {
      dispatch({ type: 'DELETE_GOAL', payload: id });
    }
  };

  const addSavings = (goalId, amount) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      dispatch({
        type: 'UPDATE_GOAL',
        payload: { ...goal, currentAmount: Math.min(goal.targetAmount, goal.currentAmount + amount) },
      });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex justify-between items-center">
          <div>
            <h2>Financial Goals</h2>
            <p className="subtitle">Set targets, track progress, and plan your savings</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); setFormData({ name: '', targetAmount: '', currentAmount: '', targetDate: '', icon: '🎯' }); }}>
            <Plus size={16} /> New Goal
          </button>
        </div>
      </div>

      {/* Goal Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editId ? 'Edit Goal' : 'Create New Goal'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Choose Icon</label>
                  <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                    {GOAL_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        className={`btn btn-ghost btn-icon`}
                        style={{
                          fontSize: 22,
                          background: formData.icon === icon ? 'rgba(252,108,38,0.15)' : 'transparent',
                          border: formData.icon === icon ? '1px solid var(--primary)' : '1px solid transparent',
                        }}
                        onClick={() => setFormData({ ...formData, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Goal Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g., New Laptop, Travel Fund, Emergency Fund"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Target Amount (₹)</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="60000"
                      min="100"
                      value={formData.targetAmount}
                      onChange={e => setFormData({ ...formData, targetAmount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currently Saved (₹)</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="0"
                      min="0"
                      value={formData.currentAmount}
                      onChange={e => setFormData({ ...formData, currentAmount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formData.targetDate}
                    onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update Goal' : 'Create Goal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h4>No goals yet</h4>
            <p className="text-muted mt-1">Create your first financial goal to start tracking progress.</p>
            <button className="btn btn-primary mt-2" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Create Goal
            </button>
          </div>
        </div>
      ) : (
        <div className="goal-grid">
          {goals.map(goal => {
            const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            const remaining = goal.targetAmount - goal.currentAmount;
            const targetDate = new Date(goal.targetDate);
            const monthsLeft = Math.max(1, Math.round((targetDate - now) / (1000 * 60 * 60 * 24 * 30)));
            const monthlyNeeded = remaining > 0 ? Math.round(remaining / monthsLeft) : 0;
            const isComplete = goal.currentAmount >= goal.targetAmount;

            return (
              <div key={goal.id} className="goal-card">
                {isComplete && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    padding: '4px 10px', background: 'var(--success-bg)',
                    borderRadius: 20, fontSize: 11, fontWeight: 600, color: 'var(--success)'
                  }}>
                    ✅ Complete!
                  </div>
                )}

                <div className="goal-card-header">
                  <span className="goal-icon">{goal.icon}</span>
                  <span className="goal-percentage">{progress.toFixed(0)}%</span>
                </div>

                <div className="goal-name">{goal.name}</div>
                <div className="goal-amounts">
                  <span>₹{goal.currentAmount.toLocaleString('en-IN')}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> / ₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="progress-bar" style={{ height: 10 }}>
                  <div
                    className={`progress-fill ${isComplete ? 'green' : progress >= 80 ? 'apricot' : ''}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {!isComplete && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFF7EE', border: '1px solid rgba(252, 108, 38, 0.15)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)' }}>
                    Need ~₹{monthlyNeeded.toLocaleString('en-IN')}/month for {monthsLeft} months
                  </div>
                )}

                <div className="goal-meta">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {targetDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                  <span>₹{remaining.toLocaleString('en-IN')} remaining</span>
                </div>

                <div className="flex gap-1 mt-2">
                  {!isComplete && (
                    <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => addSavings(goal.id, 1000)}>
                      + ₹1,000
                    </button>
                  )}
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleEdit(goal)}>
                    <Edit3 size={14} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(goal.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
