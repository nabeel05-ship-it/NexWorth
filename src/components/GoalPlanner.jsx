import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Target, Plus, Edit3, Trash2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  modalBackdropVariants,
  modalDialogVariants,
  buttonClickProps,
  iconButtonProps,
  fadeInUp,
  staggerContainer,
} from '../utils/motionVariants';

const GOAL_ICONS = ['💻', '✈️', '🛡️', '📚', '🏠', '🚗', '💍', '📱', '🎓', '🏖️', '💰', '🎯'];

export default function GoalPlanner() {
  const { state, dispatch, t, language } = useApp();
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
    if (confirm(t('goal_delete_confirm'))) {
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
    <motion.div
      variants={staggerContainer(0.06, 0.02)}
      initial="initial"
      animate="animate"
    >
      <motion.div
        className="page-header"
        variants={fadeInUp}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}
      >
        <div>
          <h2>{t('goal_title')}</h2>
          <p className="subtitle">{t('goal_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <motion.button
            className="btn btn-primary"
            onClick={() => { setShowForm(true); setEditId(null); setFormData({ name: '', targetAmount: '', currentAmount: '', targetDate: '', icon: '🎯' }); }}
            {...buttonClickProps}
          >
            <Plus size={16} /> {t('goal_new_btn')}
          </motion.button>
        </div>
      </motion.div>

      {/* Goal Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="modal-overlay"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <motion.div className="modal" variants={modalDialogVariants}>
              <div className="modal-header">
                <h3>{editId ? t('goal_edit_title') : t('goal_create_title')}</h3>
                <motion.button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)} {...iconButtonProps}>✕</motion.button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">{t('goal_choose_icon')}</label>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                      {GOAL_ICONS.map(icon => (
                        <motion.button
                          key={icon}
                          type="button"
                          className="btn btn-ghost btn-icon"
                          style={{
                            fontSize: 22,
                            background: formData.icon === icon ? 'rgba(252,108,38,0.15)' : 'transparent',
                            border: formData.icon === icon ? '1px solid var(--primary)' : '1px solid transparent',
                          }}
                          onClick={() => setFormData({ ...formData, icon })}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {icon}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('goal_name_label')}</label>
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
                      <label className="form-label">{t('goal_target_label')}</label>
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
                      <label className="form-label">{t('goal_current_label')}</label>
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
                    <label className="form-label">{t('goal_date_label')}</label>
                    <input
                      className="form-input"
                      type="date"
                      value={formData.targetDate}
                      onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <motion.button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {t('goal_cancel_btn')}
                  </motion.button>
                  <motion.button type="submit" className="btn btn-primary" {...buttonClickProps}>
                    {editId ? t('goal_update_btn') : t('goal_save_btn')}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <motion.div className="card" variants={fadeInUp}>
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h4>{t('goal_no_goals')}</h4>
            <motion.button className="btn btn-primary mt-2" onClick={() => setShowForm(true)} {...buttonClickProps}>
              <Plus size={16} /> {t('goal_new_btn')}
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div className="goal-grid" variants={staggerContainer(0.06, 0.04)}>
          {goals.map(goal => {
            const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            const remaining = goal.targetAmount - goal.currentAmount;
            const targetDate = new Date(goal.targetDate);
            const monthsLeft = Math.max(1, Math.round((targetDate - now) / (1000 * 60 * 60 * 24 * 30)));
            const monthlyNeeded = remaining > 0 ? Math.round(remaining / monthsLeft) : 0;
            const isComplete = goal.currentAmount >= goal.targetAmount;

            return (
              <motion.div
                key={goal.id}
                className="goal-card"
                variants={fadeInUp}
                whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', transition: { duration: 0.18 } }}
              >
                {isComplete && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      position: 'absolute', top: 12, right: 12,
                      padding: '4px 10px', background: 'var(--success-bg)',
                      borderRadius: 20, fontSize: 11, fontWeight: 600, color: 'var(--success)'
                    }}
                  >
                    {t('goal_reached')}
                  </motion.div>
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
                  <motion.div
                    className={`progress-fill ${isComplete ? 'green' : progress >= 80 ? 'apricot' : ''}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>

                {!isComplete && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFF7EE', border: '1px solid rgba(252, 108, 38, 0.15)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {t('goal_need_monthly', {
                      amount: monthlyNeeded.toLocaleString('en-IN'),
                      months: monthsLeft
                    })}
                  </div>
                )}

                <div className="goal-meta">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {targetDate.toLocaleDateString(language === 'kn' ? 'kn-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                  <span>₹{remaining.toLocaleString('en-IN')} {t('goal_remaining')}</span>
                </div>

                <div className="flex gap-1 mt-2">
                  {!isComplete && (
                    <>
                      <motion.button
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => addSavings(goal.id, 1000)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        + ₹1,000
                      </motion.button>
                      <motion.button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}
                        onClick={() => dispatch({ type: 'SET_CHAT_QUERY', payload: `How can I reach my ${goal.name} goal faster?` })}
                        title="Simulate savings in Ask Your Money"
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        {t('goal_ask_ai')}
                      </motion.button>
                    </>
                  )}
                  <motion.button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleEdit(goal)} {...iconButtonProps}>
                    <Edit3 size={14} />
                  </motion.button>
                  <motion.button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(goal.id)} {...iconButtonProps}>
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
