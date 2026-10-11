import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../utils/demoData';
import { parseTransactionMessage, SAMPLE_TRANSACTION_MESSAGES } from '../utils/aiTransactionParser';
import {
  Sparkles, CheckCircle2, XCircle, Edit3, MessageSquare,
  Smartphone, ShieldCheck,
  RefreshCw, Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  toastVariants,
  buttonClickProps,
  fadeInUp,
  scaleIn,
} from '../utils/motionVariants';

export default function AITransactionCapture() {
  const { dispatch, t, formatDate } = useApp();
  const [inputText, setInputText] = useState('');
  const [selectedSource, setSelectedSource] = useState('SMS');
  const [detectedTxn, setDetectedTxn] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [captureHistory, setCaptureHistory] = useState([
    {
      id: 'h1',
      name: 'Swiggy',
      amount: 450,
      category: 'food',
      paymentMethod: 'UPI',
      source: 'SMS',
      date: new Date().toISOString(),
      confirmed: true,
    },
    {
      id: 'h2',
      name: 'Amazon India',
      amount: 2499,
      category: 'shopping',
      paymentMethod: 'Credit Card',
      source: 'SMS',
      date: new Date(Date.now() - 3600000 * 2).toISOString(),
      confirmed: true,
    }
  ]);

  // Show a toast message for user feedback
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Parse text using AI engine
  const handleParse = (text, source = selectedSource) => {
    if (!text.trim()) return;
    const result = parseTransactionMessage(text, source);
    if (result && result.success) {
      setDetectedTxn(result);
      setEditData({
        merchant: result.merchant,
        amount: result.amount,
        category: result.category,
        paymentMethod: result.paymentMethod,
      });
      setIsEditing(false);
    } else {
      triggerToast(t('cap_toast_parse_err'));
    }
  };

  // Simulate one of the sample SMS / Notification messages
  const handleSimulate = (template) => {
    setInputText(template.text);
    setSelectedSource(template.source);
    handleParse(template.text, template.source);
  };

  // Simulate random
  const handleSimulateRandom = () => {
    const randomIndex = Math.floor(Math.random() * SAMPLE_TRANSACTION_MESSAGES.length);
    const template = SAMPLE_TRANSACTION_MESSAGES[randomIndex];
    handleSimulate(template);
  };

  // User confirms the detected transaction
  const handleConfirm = () => {
    if (!detectedTxn) return;

    const dataToSave = isEditing && editData ? editData : detectedTxn;

    const merchantName = (dataToSave.merchant || detectedTxn.merchant || 'Expense').trim();
    const expensePayload = {
      name: merchantName,
      merchant: merchantName,
      amount: parseFloat(dataToSave.amount || detectedTxn.amount),
      category: (dataToSave.category || detectedTxn.category || 'other').toLowerCase(),
      date: new Date().toISOString(),
      note: `${detectedTxn.source || 'SMS'} Auto-Capture (${detectedTxn.paymentMethod || 'UPI'})`,
      paymentMethod: dataToSave.paymentMethod || detectedTxn.paymentMethod || 'UPI',
      source: detectedTxn.source || 'SMS',
    };

    // Save to real app state
    dispatch({ type: 'ADD_EXPENSE', payload: expensePayload });

    // Add to local capture history
    setCaptureHistory(prev => [
      {
        id: Date.now().toString(),
        name: expensePayload.name,
        amount: expensePayload.amount,
        category: expensePayload.category,
        paymentMethod: expensePayload.paymentMethod,
        source: expensePayload.source,
        date: expensePayload.date,
        confirmed: true,
      },
      ...prev
    ]);

    triggerToast(t('cap_toast_confirmed', { amount: expensePayload.amount.toLocaleString('en-IN'), name: expensePayload.name }));
    setDetectedTxn(null);
    setIsEditing(false);
    setInputText('');
  };

  // User ignores the detected transaction
  const handleIgnore = () => {
    triggerToast(t('cap_toast_ignored'));
    setDetectedTxn(null);
    setIsEditing(false);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              background: '#1A1714',
              color: '#FFFFFF',
              padding: '14px 22px',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
              fontSize: 14,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              border: '1px solid rgba(252, 108, 38, 0.3)',
            }}
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="page-header">
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2>{t('cap_title')}</h2>
              <span className="ai-badge"><Sparkles size={12} /> {t('cap_badge_ai')}</span>
              <span className="badge" style={{ background: '#FFF4D6', color: '#D97706', border: '1px solid rgba(217, 119, 6, 0.25)' }}>
                {t('cap_badge_demo')}
              </span>
            </div>
            <p className="subtitle">
              {t('cap_subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Privacy & Security Guarantee Banner */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        style={{
          background: '#FFFDF9',
          border: '1px solid rgba(252, 108, 38, 0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
        }}
      >
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-md)',
          background: 'rgba(5, 150, 105, 0.1)',
          color: 'var(--success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ShieldCheck size={22} />
        </div>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1A1714', marginBottom: 4 }}>
            {t('cap_shield_title')}
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {t('cap_shield_desc')}
          </p>
        </div>
      </motion.div>

      {/* Main Grid: Interactive Capture Simulator + Detected Transaction Card */}
      <div className="simulator-grid" style={{ marginBottom: 28 }}>
        {/* Left Column: Simulator Controls */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div className="card-title">
              <Smartphone size={18} color="var(--primary)" />
              <span>{t('cap_sim_title')}</span>
            </div>
            <motion.button className="btn btn-outline btn-sm" onClick={handleSimulateRandom} {...buttonClickProps}>
              <RefreshCw size={13} /> {t('cap_sim_random')}
            </motion.button>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            {t('cap_sim_desc')}
          </p>

          {/* Quick Simulation Templates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {SAMPLE_TRANSACTION_MESSAGES.slice(0, 4).map(tpl => (
              <motion.button
                key={tpl.id}
                type="button"
                className="btn btn-outline"
                whileHover={{ x: 3, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.98 }}
                style={{
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: inputText === tpl.text ? '#FFF5EC' : '#FFFFFF',
                  borderColor: inputText === tpl.text ? 'var(--primary)' : 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
                onClick={() => handleSimulate(tpl)}
              >
                <span style={{ fontSize: 16 }}>
                  {tpl.source === 'SMS' ? '💬' : tpl.source === 'Email' ? '📧' : '🔔'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{tpl.sender}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tpl.source}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tpl.text}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="section-divider" style={{ margin: '16px 0' }} />

          {/* Manual Input / Custom SMS */}
          <div>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('cap_paste_label')}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {['SMS', 'Notification', 'Email'].map(s => (
                  <button
                    key={s}
                    type="button"
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 12,
                      border: '1px solid',
                      borderColor: selectedSource === s ? 'var(--primary)' : 'var(--border)',
                      background: selectedSource === s ? '#FFF5EC' : 'transparent',
                      color: selectedSource === s ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedSource(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </label>
            <textarea
              className="form-textarea"
              placeholder={t('cap_paste_placeholder')}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              style={{ minHeight: 70, marginBottom: 12 }}
            />
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => handleParse(inputText)}
              disabled={!inputText.trim()}
            >
              <Sparkles size={16} /> {t('cap_parse_btn')}
            </button>
          </div>
        </div>

        {/* Right Column: AI Transaction Detected */}
        <div>
          <AnimatePresence mode="wait">
            {detectedTxn ? (
              <motion.div
                key="detected-txn-card"
                className="card card-glow"
                variants={scaleIn}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                style={{
                  border: '2px solid var(--primary)',
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-xl)',
                  padding: '28px 24px',
                  position: 'relative',
                }}
              >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(252, 108, 38, 0.12)',
                color: 'var(--primary)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 18,
              }}>
                <Sparkles size={14} /> {t('cap_detected_title')}
              </div>

              {!isEditing ? (
                <>
                  {/* Primary Amount & Merchant Display */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 42,
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: 1.1,
                      marginBottom: 6,
                    }}>
                      ₹{detectedTxn.amount?.toLocaleString('en-IN')}
                    </div>
                    <div style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: 'var(--primary)',
                      letterSpacing: '-0.2px',
                    }}>
                      {detectedTxn.merchant}
                    </div>
                  </div>

                  {/* Metadata Tags */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: 24,
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      background: '#F5F2EB',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1A1714',
                    }}>
                      {CATEGORIES.find(c => c.id === detectedTxn.category)?.icon || '📌'} {t(`cat_${detectedTxn.category}`) || CATEGORIES.find(c => c.id === detectedTxn.category)?.name || detectedTxn.category}
                    </span>
                    <span style={{
                      padding: '6px 14px',
                      background: '#FFF4D6',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#D97706',
                    }}>
                      {detectedTxn.paymentMethod}
                    </span>
                    <span style={{
                      padding: '6px 14px',
                      background: '#F0ECE4',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                    }}>
                      {detectedTxn.source}
                    </span>
                    {detectedTxn.account && (
                      <span style={{
                        padding: '6px 12px',
                        background: '#FAF7F0',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 12,
                        color: 'var(--text-muted)',
                      }}>
                        {detectedTxn.account}
                      </span>
                    )}
                  </div>

                  {/* Raw text snippet */}
                  <div style={{
                    padding: '12px 14px',
                    background: '#FAF8F4',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    fontFamily: 'monospace',
                    marginBottom: 24,
                    lineHeight: 1.5,
                  }}>
                    "{detectedTxn.rawText}"
                  </div>

                  {/* Action Buttons: [Confirm] [Edit] [Ignore] */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 2, padding: '14px 20px', fontSize: 15 }}
                      onClick={handleConfirm}
                    >
                      <CheckCircle2 size={18} /> {t('cap_confirm_btn')}
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '14px 16px' }}
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 size={16} /> {t('cap_edit_btn')}
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '14px 16px', color: 'var(--text-muted)' }}
                      onClick={handleIgnore}
                    >
                      <XCircle size={16} /> {t('cap_ignore_btn')}
                    </button>
                  </div>
                </>
              ) : (
                /* Inline Edit State */
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{t('cap_edit_btn')}</h4>
                  <div className="form-group">
                    <label className="form-label">{t('exp_name_label')}</label>
                    <input
                      className="form-input"
                      value={editData.merchant}
                      onChange={e => setEditData({ ...editData, merchant: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">{t('exp_amount_label')}</label>
                      <input
                        className="form-input"
                        type="number"
                        value={editData.amount}
                        onChange={e => setEditData({ ...editData, amount: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('exp_category_label')}</label>
                      <select
                        className="form-select"
                        value={editData.category}
                        onChange={e => setEditData({ ...editData, category: e.target.value })}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {t(`cat_${c.id}`) || c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('exp_payment_label')}</label>
                    <select
                      className="form-select"
                      value={editData.paymentMethod}
                      onChange={e => setEditData({ ...editData, paymentMethod: e.target.value })}
                    >
                      <option value="UPI">UPI</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Wallet">Wallet</option>
                      <option value="AutoPay">AutoPay</option>
                      <option value="Cash">Cash</option>
                      <option value="NetBanking">NetBanking</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                    <motion.button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirm} {...buttonClickProps}>
                      {t('cap_confirm_btn')}
                    </motion.button>
                    <motion.button className="btn btn-outline" onClick={() => setIsEditing(false)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {t('exp_cancel_btn')}
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* Idle Placeholder */
            <motion.div
              key="idle-placeholder"
              className="card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.25 } }}
              exit={{ opacity: 0 }}
              style={{
                minHeight: 380,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 36,
                background: '#FFFDFB',
                border: '2px dashed rgba(252, 108, 38, 0.25)',
              }}
            >
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(252, 108, 38, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <MessageSquare size={28} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{t('cap_ready_title')}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.6, marginBottom: 20 }}>
                {t('cap_ready_desc')}
              </p>
              <motion.button className="btn btn-outline btn-sm" onClick={handleSimulateRandom} {...buttonClickProps}>
                {t('cap_demo_sim_btn')}
              </motion.button>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cash Expense Callout Card */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            background: '#FFF5EC',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}>
            💵
          </div>
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              {t('cap_cash_prompt_title')}
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {t('cap_cash_prompt_desc')}
            </p>
          </div>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'add-expense' })}
        >
          <Banknote size={16} /> {t('cap_cash_btn')}
        </button>
      </div>

      {/* History table */}
      {captureHistory.length > 0 && (
        <div className="card mb-3">
          <div className="card-header">
            <div className="card-title">📝 {t('cap_history_title')}</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>{t('cap_col_time')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('cap_col_merchant')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('cap_col_category')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('cap_col_payment')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('cap_col_amount')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('cap_col_status')}</th>
                </tr>
              </thead>
              <tbody>
                {captureHistory.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                      {formatDate(item.date, { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: '10px 12px' }}>{t(`cat_${item.category}`) || item.category}</td>
                    <td style={{ padding: '10px 12px' }}>{item.paymentMethod}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--danger)' }}>
                      -₹{item.amount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#DCFCE7', color: '#16A34A', fontWeight: 600 }}>
                        {t('cap_status_confirmed')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
