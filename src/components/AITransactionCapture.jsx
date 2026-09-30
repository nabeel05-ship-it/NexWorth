import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import LanguageSwitcher from './LanguageSwitcher';
import { CATEGORIES } from '../utils/demoData';
import { parseTransactionMessage, SAMPLE_TRANSACTION_MESSAGES } from '../utils/aiTransactionParser';
import {
  Sparkles, CheckCircle2, XCircle, Edit3, MessageSquare,
  BellRing, Mail, Smartphone, ArrowRight, ShieldCheck,
  Lock, AlertCircle, RefreshCw, Send, Check, Wallet, Banknote
} from 'lucide-react';

export default function AITransactionCapture() {
  const { state, dispatch, t } = useApp();
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
      triggerToast('⚠️ Could not extract transaction amount. Please check the message format.');
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

    triggerToast(`✓ Confirmed: ₹${expensePayload.amount} at ${expensePayload.name} saved to Expense Database! Dashboard & AI insights updated.`);
    setDetectedTxn(null);
    setIsEditing(false);
    setInputText('');
  };

  // User ignores the detected transaction
  const handleIgnore = () => {
    triggerToast('Transaction ignored and discarded.');
    setDetectedTxn(null);
    setIsEditing(false);
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
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
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          fontSize: 14,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid rgba(252, 108, 38, 0.3)',
        }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2>{t('cap_title')}</h2>
              <span className="ai-badge"><Sparkles size={12} /> AI Powered</span>
              <span className="badge" style={{ background: '#FFF4D6', color: '#D97706', border: '1px solid rgba(217, 119, 6, 0.25)' }}>
                Demo Mode Sandbox
              </span>
            </div>
            <p className="subtitle">
              {t('cap_subtitle')}
            </p>
          </div>
          <LanguageSwitcher compact={false} />
        </div>
      </div>

      {/* Privacy & Security Guarantee Banner */}
      <div style={{
        background: '#FFFDF9',
        border: '1px solid rgba(252, 108, 38, 0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
      }}>
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
            Zero Credential Policy & User-Authorized Access Only
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            NexWorth <strong>never</strong> asks for your UPI PIN, OTP, bank login passwords, or card CVVs. We do not access Google Pay, PhonePe, or bank accounts directly. In this browser prototype, test the complete pipeline using the simulation tools below.
          </p>
        </div>
      </div>

      {/* Main Grid: Interactive Capture Simulator + Detected Transaction Card */}
      <div className="simulator-grid" style={{ marginBottom: 28 }}>
        {/* Left Column: Simulator Controls */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div className="card-title">
              <Smartphone size={18} color="var(--primary)" />
              <span>Simulate Transaction Message</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleSimulateRandom}>
              <RefreshCw size={13} /> Random SMS
            </button>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Click any sample message below to simulate an incoming bank SMS or push notification:
          </p>

          {/* Quick Simulation Templates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {SAMPLE_TRANSACTION_MESSAGES.slice(0, 4).map(tpl => (
              <button
                key={tpl.id}
                type="button"
                className="btn btn-outline"
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
              </button>
            ))}
          </div>

          <div className="section-divider" style={{ margin: '16px 0' }} />

          {/* Manual Input / Custom SMS */}
          <div>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Or Paste Custom Transaction Text</span>
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
              placeholder="e.g., INR 450 debited from your account at SWIGGY via UPI on 30-Sep"
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
              <Sparkles size={16} /> Parse with AI
            </button>
          </div>
        </div>

        {/* Right Column: AI Transaction Detected (The Requested Confirmation Card) */}
        <div>
          {detectedTxn ? (
            <div
              className="card card-glow"
              style={{
                border: '2px solid var(--primary)',
                background: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                padding: '28px 24px',
                position: 'relative',
                animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                <Sparkles size={14} /> AI TRANSACTION DETECTED
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

                  {/* Metadata Tags (Food • UPI • Source) */}
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
                      {CATEGORIES.find(c => c.id === detectedTxn.category)?.icon || '📌'} {CATEGORIES.find(c => c.id === detectedTxn.category)?.name || detectedTxn.category}
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
                      Source: {detectedTxn.source}
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
                  <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Edit Detected Transaction</h4>
                  <div className="form-group">
                    <label className="form-label">Merchant Name</label>
                    <input
                      className="form-input"
                      value={editData.merchant}
                      onChange={e => setEditData({ ...editData, merchant: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Amount (₹)</label>
                      <input
                        className="form-input"
                        type="number"
                        value={editData.amount}
                        onChange={e => setEditData({ ...editData, amount: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={editData.category}
                        onChange={e => setEditData({ ...editData, category: e.target.value })}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
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
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleConfirm}>
                      Save & Confirm
                    </button>
                    <button className="btn btn-outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Idle Placeholder */
            <div className="card" style={{
              minHeight: 380,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: 36,
              background: '#FFFDFB',
              border: '2px dashed rgba(252, 108, 38, 0.25)',
            }}>
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
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Ready to Capture</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.6, marginBottom: 20 }}>
                Select one of the sample SMS alerts on the left or paste your own transaction notification to see AI extraction in action.
              </p>
              <button className="btn btn-outline btn-sm" onClick={handleSimulateRandom}>
                ⚡ Try Demo Simulation
              </button>
            </div>
          )}
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
              Have Cash Expenses?
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Cash transactions cannot be automatically captured from SMS. Use manual 1-click cash entry.
            </p>
          </div>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'add-expense' })}
        >
          <Banknote size={16} /> + Cash Expense
        </button>
      </div>

      {/* Core Flow Architecture Pipeline */}
      <div className="card mb-3">
        <div className="card-header">
          <div className="card-title">🔄 Core AI Capture Pipeline</div>
          <span className="badge badge-primary">How It Works</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12,
          textAlign: 'center',
          alignItems: 'center',
          padding: '16px 0',
        }}>
          {[
            { step: '1', title: 'Notification / SMS', icon: '📱', desc: 'User-Authorized Alert' },
            { step: '2', title: 'AI Parser', icon: '🧠', desc: 'Regex & NLP Model' },
            { step: '3', title: 'Structured Txn', icon: '📊', desc: 'Merchant & Category' },
            { step: '4', title: 'User Confirmation', icon: '✅', desc: 'One-Click Verify' },
            { step: '5', title: 'Expense Database', icon: '💾', desc: 'Stored Locally' },
            { step: '6', title: 'Money Insights', icon: '💡', desc: 'Real-Time Intelligence' },
            { step: '7', title: 'Ask Your Money', icon: '💬', desc: 'AI Financial Query' },
          ].map((s, idx, arr) => (
            <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: idx === 3 ? 'var(--primary)' : '#FFF7F0',
                color: idx === 3 ? '#FFFFFF' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                marginBottom: 8,
                boxShadow: idx === 3 ? '0 4px 12px rgba(252, 108, 38, 0.3)' : 'none',
                border: '1px solid rgba(252, 108, 38, 0.2)',
              }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Integration & Future Architecture Roadmap */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Mail size={18} color="var(--primary)" />
            <span>Email Transaction Import (Future-Ready Integration)</span>
          </div>
          <span className="badge" style={{ background: '#FFF4D6', color: '#D97706' }}>Future Architecture</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
          NexWorth supports a secure email receipt capture model designed for zero-password access:
        </p>

        <div className="architecture-flow" style={{ background: '#FAF8F4', borderRadius: 'var(--radius-lg)' }}>
          <div className="arch-node default">📧 Authorized Email Provider (Google / Microsoft OAuth)</div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node default" style={{ borderColor: 'var(--primary)' }}>
            🔑 OAuth Permission (Restricted read-only financial receipts scope — No inbox passwords stored)
          </div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node accent">🤖 Transaction Email Parser (Identifies Swiggy, Uber, Amazon receipts)</div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node default">✨ AI Structured Extraction (Amount, Payee, Tax, Category)</div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node primary">✅ User Confirmation Prompt</div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node accent">💾 Local Expense Database & Insights</div>
        </div>

        <div className="disclaimer mt-2">
          🔒 <strong>Privacy Assurance:</strong> We never implement unrestricted email scanning. Only receipts matching authorized financial domains are parsed with explicit user confirmation before any transaction is saved.
        </div>
      </div>
    </div>
  );
}
