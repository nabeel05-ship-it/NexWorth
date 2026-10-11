import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { compareSpendSaveInvest } from '../utils/aiEngine';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { fadeInUp, buttonClickProps, cardHoverProps, staggerContainer } from '../utils/motionVariants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function SpendSaveInvest() {
  const { t, language } = useApp();
  const [amount, setAmount] = useState(5000);
  const [activeTab, setActiveTab] = useState(2); // Default to Long Term (5, 10, 20 yrs)
  const [isRecurring, setIsRecurring] = useState(false); // Default to One-Time Purchase

  const timeframes = [
    { years: [1, 3, 5], label: t('compare_term_short') },
    { years: [5, 10, 15], label: t('compare_term_medium') },
    { years: [5, 10, 20], label: t('compare_term_long') },
  ];

  const comparisons = useMemo(() => compareSpendSaveInvest(amount, timeframes[activeTab].years, isRecurring), [amount, activeTab, isRecurring]);

  const chartData = useMemo(() => ({
    labels: comparisons.map(c => c.years === 1 ? t('compare_after_year', { years: c.years }) : t('compare_after_years', { years: c.years })),
    datasets: [
      {
        label: isRecurring ? t('compare_spent_total') : t('compare_spent_today'),
        data: comparisons.map(c => c.spend),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: t('compare_savings_acc'),
        data: comparisons.map(c => c.savings),
        backgroundColor: 'rgba(168, 162, 158, 0.75)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: isRecurring ? `${t('compare_rd_title')} (${t('compare_fd_est_rate')})` : `${t('compare_fd_title')} (${t('compare_fd_est_rate')})`,
        data: comparisons.map(c => c.fd),
        backgroundColor: 'rgba(217, 119, 6, 0.8)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: isRecurring ? `${t('compare_sip_title')} (${t('compare_sip_est_rate')})` : `${t('compare_equity_title')} (${t('compare_sip_est_rate')})`,
        data: comparisons.map(c => c.sip),
        backgroundColor: '#FC6C26',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }), [comparisons, isRecurring, language, t]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8E877F', font: { size: 12 } } },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        ticks: { color: '#8E877F', font: { size: 11 }, callback: v => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}k` },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#655E57', font: { size: 11, weight: '500' }, usePointStyle: true, pointStyleWidth: 8, padding: 16 },
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(252, 108, 38, 0.25)',
        borderWidth: 1,
        titleColor: '#1A1714',
        bodyColor: '#655E57',
        padding: 12,
        cornerRadius: 10,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}` },
      },
    },
  };

  return (
    <motion.div
      variants={staggerContainer(0.05, 0.02)}
      initial="initial"
      animate="animate"
    >
      <motion.div className="page-header" variants={fadeInUp}>
        <h2>{t('compare_title')}</h2>
        <p className="subtitle">{t('compare_subtitle')}</p>
      </motion.div>

      {/* Amount Input */}
      <motion.div className="card mb-3" variants={fadeInUp} {...cardHoverProps}>
        <div className="card-title mb-2">{t('compare_amount_prompt')}</div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk'", color: 'var(--accent)' }}>₹</span>
          <input
            className="form-input"
            type="number"
            value={amount}
            onChange={e => setAmount(parseInt(e.target.value) || 0)}
            min="100"
            style={{ maxWidth: 200, fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk'" }}
          />
          <div className="btn-group">
            {[1000, 2000, 5000, 10000].map(v => (
              <motion.button
                key={v}
                className={`btn btn-sm ${amount === v ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setAmount(v)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                ₹{v.toLocaleString('en-IN')}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Mode Toggle: One-Time Purchase vs Recurring Habit */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {t('compare_type_label')}
          </div>
          <div className="btn-group">
            <motion.button
              type="button"
              className={`btn btn-sm ${!isRecurring ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setIsRecurring(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {t('compare_onetime_btn', { amount: amount.toLocaleString('en-IN') })}
            </motion.button>
            <motion.button
              type="button"
              className={`btn btn-sm ${isRecurring ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setIsRecurring(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {t('compare_recurring_btn', { amount: amount.toLocaleString('en-IN') })}
            </motion.button>
          </div>
        </div>

        <div className="tabs mt-2">
          {timeframes.map((tf, i) => (
            <motion.button
              key={i}
              className={`tab ${activeTab === i ? 'active' : ''}`}
              onClick={() => setActiveTab(i)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {tf.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        style={{ padding: '14px 18px', background: '#FFF7EE', border: '1px solid rgba(252, 108, 38, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: 14, color: 'var(--text-secondary)' }}
      >
        💡 {!isRecurring
          ? t('compare_banner_onetime', { amount: amount.toLocaleString('en-IN') })
          : t('compare_banner_recurring', { amount: amount.toLocaleString('en-IN') })}
      </motion.div>

      {/* Comparison Cards */}
      {comparisons.map((comp, ci) => (
        <motion.div key={ci} className="mb-3" variants={fadeInUp}>
          <h3 style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 12, fontFamily: "'Space Grotesk'" }}>
            {comp.years === 1 ? t('compare_after_year', { years: comp.years }) : t('compare_after_years', { years: comp.years })}
          </h3>
          <div className="compare-grid">
            <motion.div className="compare-card spend" whileHover={{ y: -3, transition: { duration: 0.16 } }}>
              <h4>💸 {isRecurring ? t('compare_spent_total') : t('compare_spent_today')}</h4>
              <div className="compare-amount">₹{comp.spend.toLocaleString('en-IN')}</div>
              <div className="compare-label">
                {isRecurring ? `₹${amount.toLocaleString('en-IN')}/${t('common_month')} × ${comp.years * 12} ${t('common_months')}` : t('compare_spent_consumed')}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                {t('compare_spent_consumed')}
              </div>
            </motion.div>

            <motion.div className="compare-card fd" whileHover={{ y: -3, transition: { duration: 0.16 } }}>
              <h4>🏦 {isRecurring ? t('compare_rd_title') : t('compare_fd_title')}</h4>
              <div className="compare-amount">₹{comp.fd.toLocaleString('en-IN')}</div>
              <div className="compare-label">{t('compare_fd_est_rate')}</div>
              <div style={{ marginTop: 12 }}>
                <span className="badge badge-warning">
                  {t('compare_fd_interest', { interest: (comp.fd - comp.spend).toLocaleString('en-IN') })}
                </span>
              </div>
            </motion.div>

            <motion.div className="compare-card sip" whileHover={{ y: -3, transition: { duration: 0.16 } }}>
              <h4>📈 {isRecurring ? t('compare_sip_title') : t('compare_equity_title')}</h4>
              <div className="compare-amount">₹{comp.sip.toLocaleString('en-IN')}</div>
              <div className="compare-label">{t('compare_sip_est_rate')}</div>
              <div style={{ marginTop: 12 }}>
                <span className="badge badge-success">
                  {t('compare_sip_growth', { growth: (comp.sip - comp.spend).toLocaleString('en-IN') })}
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ))}

      {/* Chart */}
      <motion.div className="card mt-3" variants={fadeInUp} {...cardHoverProps}>
        <div className="card-header">
          <div className="card-title"><TrendingUp size={16} /> {t('compare_chart_title')}</div>
        </div>
        <div className="chart-container" style={{ height: 320 }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </motion.div>

      <div className="disclaimer mt-3">
        {t('compare_disclaimer')}
      </div>
    </motion.div>
  );
}

