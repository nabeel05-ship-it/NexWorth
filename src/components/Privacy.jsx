import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Lock, Eye, Server, Fingerprint, Ban } from 'lucide-react';
import { motion } from 'motion/react';
import { fadeInUp, cardHoverProps, staggerContainer } from '../utils/motionVariants';

export default function Privacy() {
  const { t } = useApp();

  return (
    <motion.div
      variants={staggerContainer(0.06, 0.02)}
      initial="initial"
      animate="animate"
    >
      <motion.div className="page-header" variants={fadeInUp}>
        <h2>{t('priv_title')}</h2>
        <p className="subtitle">{t('priv_subtitle')}</p>
      </motion.div>

      {/* Privacy Statement */}
      <motion.div
        className="card mb-3"
        variants={fadeInUp}
        {...cardHoverProps}
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFDF9 100%)',
          border: '1px solid rgba(252, 108, 38, 0.18)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div className="flex items-center gap-1 mb-2">
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(252, 108, 38, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Shield size={22} color="var(--primary)" />
          </div>
          <h3 style={{ fontFamily: "'Space Grotesk'", fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {t('priv_banner_title')}
          </h3>
        </div>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 780, margin: 0 }}>
          {t('priv_banner_desc')}
        </p>
      </motion.div>

      {/* What We NEVER Ask */}
      <motion.div className="card mb-3" variants={fadeInUp} {...cardHoverProps}>
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
            <motion.div
              key={i}
              whileHover={{ scale: 1.02, transition: { duration: 0.14 } }}
              style={{
                padding: '14px 16px', background: 'rgba(255,61,113,0.05)',
                border: '1px solid rgba(255,61,113,0.15)', borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--danger)' }}>{item.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* How Data is Handled */}
      <motion.div className="card mb-3" variants={fadeInUp} {...cardHoverProps}>
        <div className="card-title mb-2">🔐 {t('priv_handling_title')}</div>
        <div className="privacy-grid">
          <motion.div className="privacy-card" whileHover={{ y: -3, transition: { duration: 0.16 } }}>
            <div className="privacy-icon"><Lock size={28} color="var(--primary-light)" /></div>
            <h4>{t('priv_card1_title')}</h4>
            <p>{t('priv_card1_desc')}</p>
          </motion.div>
          <motion.div className="privacy-card" whileHover={{ y: -3, transition: { duration: 0.16 } }}>
            <div className="privacy-icon"><Eye size={28} color="var(--accent)" /></div>
            <h4>{t('priv_card2_title')}</h4>
            <p>{t('priv_card2_desc')}</p>
          </motion.div>
          <motion.div className="privacy-card" whileHover={{ y: -3, transition: { duration: 0.16 } }}>
            <div className="privacy-icon"><Server size={28} color="var(--success)" /></div>
            <h4>{t('priv_card3_title')}</h4>
            <p>{t('priv_card3_desc')}</p>
          </motion.div>
          <motion.div className="privacy-card" whileHover={{ y: -3, transition: { duration: 0.16 } }}>
            <div className="privacy-icon"><Fingerprint size={28} color="var(--info)" /></div>
            <h4>{t('priv_card4_title')}</h4>
            <p>{t('priv_card4_desc')}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Data Example */}
      <motion.div className="card" variants={fadeInUp} {...cardHoverProps}>
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
      </motion.div>
    </motion.div>
  );
}
