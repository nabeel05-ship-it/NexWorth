import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Lock, Eye, Server, Fingerprint, Ban } from 'lucide-react';

export default function Privacy() {
  const { t } = useApp();

  return (
    <div>
      <div className="page-header">
        <h2>{t('priv_title')}</h2>
        <p className="subtitle">{t('priv_subtitle')}</p>
      </div>

      {/* Privacy Statement */}
      <div className="card card-glow mb-3" style={{ background: 'linear-gradient(135deg, rgba(0,214,143,0.08) 0%, rgba(26,26,46,0.95) 40%)' }}>
        <div className="flex items-center gap-1 mb-2">
          <Shield size={24} color="var(--success)" />
          <h3 style={{ fontFamily: "'Space Grotesk'", fontSize: 20, color: 'var(--success)' }}>
            {t('priv_banner_title')}
          </h3>
        </div>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 700 }}>
          {t('priv_banner_desc')}
        </p>
      </div>

      {/* What We NEVER Ask */}
      <div className="card mb-3">
        <div className="card-header">
          <div className="card-title"><Ban size={16} color="var(--danger)" /> {t('priv_never_title')}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { icon: '🔒', label: t('priv_item_upi') },
            { icon: '🏦', label: t('priv_item_bank_pass') },
            { icon: '💳', label: t('priv_item_cvv') },
            { icon: '📱', label: t('priv_item_otp') },
            { icon: '📲', label: t('priv_item_gpay') },
            { icon: '📲', label: t('priv_item_phonepe') },
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
        <div className="card-title mb-2">🔐 {t('priv_handling_title')}</div>
        <div className="privacy-grid">
          <div className="privacy-card">
            <div className="privacy-icon"><Lock size={28} color="var(--primary-light)" /></div>
            <h4>{t('priv_card1_title')}</h4>
            <p>{t('priv_card1_desc')}</p>
          </div>
          <div className="privacy-card">
            <div className="privacy-icon"><Eye size={28} color="var(--accent)" /></div>
            <h4>{t('priv_card2_title')}</h4>
            <p>{t('priv_card2_desc')}</p>
          </div>
          <div className="privacy-card">
            <div className="privacy-icon"><Server size={28} color="var(--success)" /></div>
            <h4>{t('priv_card3_title')}</h4>
            <p>{t('priv_card3_desc')}</p>
          </div>
          <div className="privacy-card">
            <div className="privacy-icon"><Fingerprint size={28} color="var(--info)" /></div>
            <h4>{t('priv_card4_title')}</h4>
            <p>{t('priv_card4_desc')}</p>
          </div>
        </div>
      </div>

      {/* Data Example */}
      <div className="card mb-3">
        <div className="card-title mb-2">📋 {t('priv_example_title')}</div>
        <div style={{
          padding: 20, background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
          fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 2,
        }}>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('priv_example_date')}</span> <span style={{ color: 'var(--primary)' }}>30 September 2026</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('priv_example_amount')}</span> <span style={{ color: 'var(--primary)' }}>₹450</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('priv_example_merchant')}</span> <span style={{ color: 'var(--primary)' }}>Swiggy</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('priv_example_category')}</span> <span style={{ color: 'var(--primary)' }}>Food</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>{t('priv_example_source')}</span> <span style={{ color: 'var(--primary)' }}>SMS (User Confirmed)</span></div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
          {t('priv_example_note')}
        </p>
      </div>

      {/* Future Architecture */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🚀 {t('priv_roadmap_title')}</div>
          <span className="badge badge-primary">{t('priv_roadmap_badge')}</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
          {t('priv_roadmap_desc')}
        </p>

        <div className="architecture-flow" style={{ background: '#FAF8F4', borderRadius: 'var(--radius-lg)' }}>
          <div className="arch-node default">📧 {t('priv_node_1')}</div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node default" style={{ borderColor: 'var(--primary)' }}>
            🔑 {t('priv_node_2')}
          </div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node accent">🤖 {t('priv_node_3')}</div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node default">✅ {t('priv_node_4')}</div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node primary">💾 {t('priv_node_5')}</div>
          <div className="arch-arrow">↓</div>
          <div className="arch-node accent">💡 {t('priv_node_6')}</div>
        </div>

        <div className="disclaimer mt-2">
          {t('priv_roadmap_disclaimer')}
        </div>
      </div>
    </div>
  );
}

