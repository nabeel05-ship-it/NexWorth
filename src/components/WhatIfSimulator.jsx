import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculateWhatIf } from '../utils/aiEngine';
import { CATEGORIES } from '../utils/demoData';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { GitCompareArrows, Zap, TrendingUp, Calculator } from 'lucide-react';
import { motion } from 'motion/react';
import { fadeInUp, buttonClickProps, cardHoverProps, staggerContainer } from '../utils/motionVariants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function WhatIfSimulator() {
  const { t, language } = useApp();
  const [amount, setAmount] = useState(2000);
  const [months, setMonths] = useState(12);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [activePreset, setActivePreset] = useState(null);

  const getPresets = (lang) => {
    if (lang === 'kn') {
      return [
        { label: 'ತಿಂಗಳಿಗೆ ₹1,000 ಊಟದ ಖರ್ಚು ಕಡಿಮೆ ಮಾಡಿ', amount: 1000, months: 12, icon: '🍕' },
        { label: 'ಪ್ರತಿ ತಿಂಗಳು ₹2,000 ಉಳಿಸಿ', amount: 2000, months: 12, icon: '💰' },
        { label: 'ಶಾಪಿಂಗ್ ಖರ್ಚನ್ನು ₹1,500 ಕಡಿತಗೊಳಿಸಿ', amount: 1500, months: 12, icon: '🛍️' },
        { label: '6 ತಿಂಗಳಿಗೆ ₹5,000/ತಿಂಗಳು ಉಳಿಸಿ', amount: 5000, months: 6, icon: '🎯' },
        { label: 'ಲ್ಯಾಪ್‌ಟಾಪ್ ಉಳಿತಾಯ — ₹5,000/ತಿಂಗಳು × 12', amount: 5000, months: 12, icon: '💻' },
      ];
    }
    if (lang === 'hi') {
      return [
        { label: 'खाने पर ₹1,000/माह कम खर्च करें', amount: 1000, months: 12, icon: '🍕' },
        { label: 'हर महीने ₹2,000 बचाएं', amount: 2000, months: 12, icon: '💰' },
        { label: 'शॉपिंग में ₹1,500/माह की कटौती करें', amount: 1500, months: 12, icon: '🛍️' },
        { label: '6 महीने के लिए ₹5,000/माह बचाएं', amount: 5000, months: 6, icon: '🎯' },
        { label: 'लैपटॉप के लिए बचत — ₹5,000/माह × 12', amount: 5000, months: 12, icon: '💻' },
      ];
    }
    return [
      { label: 'Reduce food spending by ₹1,000/month', amount: 1000, months: 12, icon: '🍕' },
      { label: 'Save ₹2,000 every month', amount: 2000, months: 12, icon: '💰' },
      { label: 'Cut shopping by ₹1,500/month', amount: 1500, months: 12, icon: '🛍️' },
      { label: 'Save ₹5,000/month for 6 months', amount: 5000, months: 6, icon: '🎯' },
      { label: 'Save for laptop — ₹5,000/month × 12', amount: 5000, months: 12, icon: '💻' },
    ];
  };

  const presets = getPresets(language);

  const result = useMemo(() => calculateWhatIf({ amount, months, annualReturn }), [amount, months, annualReturn]);

  const handlePreset = (preset, index) => {
    setAmount(preset.amount);
    setMonths(preset.months);
    setActivePreset(index);
  };

  // Chart data
  const chartData = useMemo(() => {
    const periods = [];
    const savedData = [];
    const investedData = [];
    const fdData = [];

    for (let m = 0; m <= months; m += Math.max(1, Math.floor(months / 6))) {
      periods.push(`${m}m`);
      const mResult = calculateWhatIf({ amount, months: m, annualReturn });
      savedData.push(mResult.totalSaved);
      investedData.push(mResult.investedValue);
      fdData.push(mResult.fdValue);
    }

    return {
      labels: periods,
      datasets: [
        {
          label: t('whatif_total_saved'),
          data: savedData,
          backgroundColor: 'rgba(215, 206, 195, 0.65)',
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: t('whatif_fd_value'),
          data: fdData,
          backgroundColor: 'rgba(217, 119, 6, 0.75)',
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: t('whatif_invested_value'),
          data: investedData,
          backgroundColor: '#FC6C26',
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }, [amount, months, annualReturn, language, t]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8E877F', font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        ticks: { color: '#8E877F', font: { size: 11 }, callback: v => `₹${(v/1000).toFixed(0)}k` },
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
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}`,
        },
      },
    },
  };

  return (
    <motion.div
      variants={staggerContainer(0.05, 0.02)}
      initial="initial"
      animate="animate"
    >
      <motion.div
        className="page-header"
        variants={fadeInUp}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}
      >
        <div>
          <div className="flex items-center gap-1">
            <h2>{t('whatif_title')}</h2>
            <span className="ai-badge"><Zap size={12} /> {t('whatif_badge_interactive')}</span>
          </div>
          <p className="subtitle">{t('whatif_subtitle')}</p>
        </div>
      </motion.div>

      {/* Preset Scenarios */}
      <motion.div className="card mb-3" variants={fadeInUp} {...cardHoverProps}>
        <div className="card-title mb-2">⚡ {t('whatif_presets_title')}</div>
        <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
          {presets.map((preset, i) => (
            <motion.button
              key={i}
              className={`btn ${activePreset === i ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => handlePreset(preset, i)}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.12 }}
            >
              {preset.icon} {preset.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div className="simulator-grid" variants={fadeInUp}>
        {/* Input Panel */}
        <div className="simulator-panel">
          <div className="card-title mb-2"><Calculator size={16} /> {t('whatif_configure_title')}</div>

          <div className="form-group">
            <label className="form-label">{t('whatif_monthly_savings')} (₹)</label>
            <input
              className="form-input"
              type="number"
              value={amount}
              onChange={e => { setAmount(parseInt(e.target.value) || 0); setActivePreset(null); }}
              min="100"
              step="500"
            />
            <input
              type="range"
              min="100"
              max="20000"
              step="100"
              value={amount}
              onChange={e => { setAmount(parseInt(e.target.value)); setActivePreset(null); }}
              style={{ width: '100%', marginTop: 8, accentColor: '#FC6C26' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('whatif_duration')}: {months}</label>
            <input
              type="range"
              min="1"
              max="60"
              value={months}
              onChange={e => setMonths(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#FC6C26' }}
            />
            <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>1 {t('common_month')}</span>
              <span>60 {t('common_months')}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('whatif_return_rate')}: {annualReturn}%</label>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={annualReturn}
              onChange={e => setAnnualReturn(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#FFF4D6' }}
            />
            <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>0%</span>
              <span>Savings ~4%</span>
              <span>FD ~7%</span>
              <span>Equity ~12-15%</span>
              <span>20%</span>
            </div>
          </div>

          <div className="disclaimer">
            {t('whatif_disclaimer')}
          </div>
        </div>

        {/* Results Panel */}
        <div className="simulator-panel">
          <div className="card-title mb-2"><TrendingUp size={16} /> {t('whatif_results_title')}</div>

          <div className="scenario-result">
            <motion.div className="scenario-box" whileHover={{ y: -2, transition: { duration: 0.15 } }}>
              <div className="scenario-label">{t('whatif_monthly_label')}</div>
              <div className="scenario-value">₹{amount.toLocaleString('en-IN')}</div>
              <div className="scenario-note">/{t('common_month')}</div>
            </motion.div>
            <motion.div className="scenario-box" whileHover={{ y: -2, transition: { duration: 0.15 } }}>
              <div className="scenario-label">{t('whatif_total_saved')}</div>
              <div className="scenario-value">₹{result.totalSaved.toLocaleString('en-IN')}</div>
              <div className="scenario-note">{months} {t('common_months')}</div>
            </motion.div>
            <motion.div className="scenario-box" style={{ background: '#FFFDF9', borderColor: 'rgba(217, 119, 6, 0.25)' }} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
              <div className="scenario-label">{t('whatif_fd_est')}</div>
              <div className="scenario-value" style={{ color: 'var(--accent-dark)' }}>₹{result.fdValue.toLocaleString('en-IN')}</div>
              <div className="scenario-note">@7% p.a.</div>
            </motion.div>
            <motion.div className="scenario-box" style={{ background: 'rgba(5, 150, 105, 0.06)', borderColor: 'rgba(5, 150, 105, 0.2)' }} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
              <div className="scenario-label">{t('whatif_invest_est')}</div>
              <div className="scenario-value" style={{ color: 'var(--success)' }}>₹{result.investedValue.toLocaleString('en-IN')}</div>
              <div className="scenario-note">@{annualReturn}% p.a.</div>
            </motion.div>
          </div>

          {result.estimatedGrowth > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 16, padding: '14px 18px', background: '#FFF7F0',
                borderRadius: 'var(--radius-md)', border: '1px solid rgba(252,108,38,0.2)'
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {t('whatif_gain_note', {
                  amount: amount.toLocaleString('en-IN'),
                  months,
                  saved: result.totalSaved.toLocaleString('en-IN'),
                  invested: result.investedValue.toLocaleString('en-IN'),
                  gain: result.estimatedGrowth.toLocaleString('en-IN'),
                  rate: annualReturn
                })}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div className="card mt-3" variants={fadeInUp} {...cardHoverProps}>
        <div className="card-header">
          <div className="card-title">📈 {t('whatif_chart_growth')}</div>
        </div>
        <div className="chart-container" style={{ height: 300 }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </motion.div>
    </motion.div>
  );
}
