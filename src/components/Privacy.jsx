import React from 'react';
import { Shield, Lock, Eye, Server, Fingerprint, Ban } from 'lucide-react';

export default function Privacy() {
  return (
    <div>
      <div className="page-header">
        <h2>Privacy & Security</h2>
        <p className="subtitle">Your financial data security is our top priority</p>
      </div>

      {/* Privacy Statement */}
      <div className="card card-glow mb-3" style={{ background: 'linear-gradient(135deg, rgba(0,214,143,0.08) 0%, rgba(26,26,46,0.95) 40%)' }}>
        <div className="flex items-center gap-1 mb-2">
          <Shield size={24} color="var(--success)" />
          <h3 style={{ fontFamily: "'Space Grotesk'", fontSize: 20, color: 'var(--success)' }}>
            Your Financial Credentials Are Never Required
          </h3>
        </div>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 700 }}>
          NexWorth is designed with privacy at its core. We never ask for, collect, or store any sensitive financial credentials. Your data stays entirely on your device.
        </p>
      </div>

      {/* What We NEVER Ask */}
      <div className="card mb-3">
        <div className="card-header">
          <div className="card-title"><Ban size={16} color="var(--danger)" /> We NEVER Ask For</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { icon: '🔒', label: 'UPI PIN' },
            { icon: '🏦', label: 'Bank Password' },
            { icon: '💳', label: 'Card CVV' },
            { icon: '📱', label: 'OTP / Verification Codes' },
            { icon: '📲', label: 'Google Pay Password' },
            { icon: '📲', label: 'PhonePe Password' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '14px 16px', background: 'rgba(255,61,113,0.05)',
              border: '1px solid rgba(255,61,113,0.15)', borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--danger)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How Data is Handled */}
      <div className="card mb-3">
        <div className="card-title mb-2">🔐 How Your Data Is Handled</div>
        <div className="privacy-grid">
          <div className="privacy-card">
            <div className="privacy-icon"><Lock size={28} color="var(--primary-light)" /></div>
            <h4>Local Storage Only</h4>
            <p>All your expense data is stored locally in your browser. No data is sent to external servers in this prototype.</p>
          </div>
          <div className="privacy-card">
            <div className="privacy-icon"><Eye size={28} color="var(--accent)" /></div>
            <h4>Minimal Data</h4>
            <p>Only basic transaction information is used for analysis: date, amount, merchant name, and category. Nothing more.</p>
          </div>
          <div className="privacy-card">
            <div className="privacy-icon"><Server size={28} color="var(--success)" /></div>
            <h4>No Direct Bank Access</h4>
            <p>NexWorth never accesses Google Pay, PhonePe, or bank accounts directly. Data is parsed from user-authorized notifications, SMS, or manual cash logs.</p>
          </div>
          <div className="privacy-card">
            <div className="privacy-icon"><Fingerprint size={28} color="var(--info)" /></div>
            <h4>Client-Side AI Parsing</h4>
            <p>SMS & notification texts are parsed locally in your browser. No messages, credentials, or personal identification are uploaded or stored externally.</p>
          </div>
        </div>
      </div>

      {/* Data Example */}
      <div className="card mb-3">
        <div className="card-title mb-2">📋 Example of Data We Use</div>
        <div style={{
          padding: 20, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
          fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2,
        }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Date:</span> <span style={{ color: 'var(--primary)' }}>30 September 2026</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Amount:</span> <span style={{ color: 'var(--primary)' }}>₹450</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Merchant:</span> <span style={{ color: 'var(--primary)' }}>Swiggy</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Category:</span> <span style={{ color: 'var(--primary)' }}>Food</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Source:</span> <span style={{ color: 'var(--primary)' }}>SMS (User Confirmed)</span></div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
          This is the maximum level of information used for analysis. No passwords, PINs, OTPs, or personal identification is ever requested.
        </p>
      </div>

      {/* Future Architecture */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🚀 Future Integration Roadmap</div>
          <span className="badge badge-primary">Future Scope</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
          NexWorth is designed for future-ready, consent-based integrations including authorized email receipt parsing and RBI-regulated Account Aggregators:
        </p>

        <div className="architecture-flow" style={{ background: '#FAF8F4', borderRadius: 'var(--radius-lg)' }}>
          <div className="arch-node default">📧 Authorized Email Provider / Bank SMS Gateway</div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node default" style={{ borderColor: 'var(--primary)' }}>
            🔑 OAuth Permission / User Consent (Zero Password Storage)
          </div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node accent">🤖 AI Transaction Parser (Extracts Amount & Payee)</div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node default">✅ User Confirmation Prompt</div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node primary">💾 Confirmed Expense Database</div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node accent">💡 AI Insights & Simulation</div>
        </div>

        <div className="disclaimer mt-2">
          ℹ️ Future integrations adhere to strict zero-password and explicit-confirmation principles. The current prototype operates safely in client-side sandbox mode.
        </div>
      </div>
    </div>
  );
}
