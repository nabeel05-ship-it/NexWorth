import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getSpendingForecast } from '../utils/aiEngine';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'motion/react';
import { fadeInUp, cardHoverProps, staggerContainer } from '../utils/motionVariants';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function SpendingForecast() {
  const { state, t, language, getMonthName } = useApp();
  const { expenses } = state;

  const now = new Date();
  const forecast = useMemo(() => getSpendingForecast(expenses), [expenses]);

  // Month labels localized
  const labels = useMemo(() => {
    const result = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push(getMonthName(d.getMonth()));
    }
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      result.push(`${getMonthName(d.getMonth())} (${t('fore_estimated')})`);
    }
    return result;
  }, [language, t, getMonthName]);

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: t('fore_actual_spending'),
        data: [...forecast.historical, null, null, null],
        borderColor: '#FC6C26',
        backgroundColor: 'rgba(252, 108, 38, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#FC6C26',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 8,
      },
      {
        label: t('fore_est_spending'),
        data: [null, null, forecast.historical[2], ...forecast.forecasted],
        borderColor: '#D97706',
        backgroundColor: 'rgba(217, 119, 6, 0.08)',
        fill: true,
        borderDash: [8, 4],
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#D97706',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 8,
      },
    ],
  }), [forecast, labels, language, t]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8E877F', font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        ticks: { color: '#8E877F', font: { size: 11 }, callback: v => `₹${(v / 1000).toFixed(0)}k` },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#655E57', font: { size: 12, weight: '500' }, usePointStyle: true, pointStyleWidth: 8, padding: 16 },
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
        callbacks: { label: (ctx) => ctx.parsed.y !== null ? `${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}` : '' },
      },
    },
  };

  const TrendIcon = forecast.trend === 'increasing' ? TrendingUp : forecast.trend === 'decreasing' ? TrendingDown : Minus;
  const trendColor = forecast.trend === 'increasing' ? 'var(--danger)' : forecast.trend === 'decreasing' ? 'var(--success)' : 'var(--text-muted)';
  const trendLabel = forecast.trend === 'increasing' ? t('fore_trend_increasing') : forecast.trend === 'decreasing' ? t('fore_trend_decreasing') : t('fore_trend_stable');

  return (
    <motion.div
      variants={staggerContainer(0.06, 0.02)}
      initial="initial"
      animate="animate"
    >
      <motion.div className="page-header" variants={fadeInUp}>
        <div className="flex items-center gap-1">
          <h2>{t('fore_title')}</h2>
          <span className="ai-badge"><Brain size={12} /> {t('fore_badge_ai')}</span>
        </div>
        <p className="subtitle">{t('fore_subtitle')}</p>
      </motion.div>

      {/* Trend Summary */}
      <motion.div className="stat-grid" variants={staggerContainer(0.04, 0.05)}>
        <motion.div className="stat-card" variants={fadeInUp} {...cardHoverProps}>
          <div className="stat-label">{t('fore_current_month')}</div>
          <div className="stat-value">₹{forecast.historical[2]?.toLocaleString('en-IN') || '0'}</div>
        </motion.div>
        <motion.div className="stat-card" variants={fadeInUp} {...cardHoverProps}>
          <div className="stat-label">{t('fore_next_month_est')}</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>₹{forecast.forecasted[0]?.toLocaleString('en-IN') || '0'}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>{t('fore_estimated')}</div>
        </motion.div>
        <motion.div className="stat-card" variants={fadeInUp} {...cardHoverProps}>
          <div className="stat-label">{t('fore_trend')}</div>
          <div className="stat-value flex items-center gap-1" style={{ color: trendColor }}>
            <TrendIcon size={20} />
            {trendLabel}
          </div>
          <div className="stat-change" style={{ color: trendColor }}>
            ~₹{forecast.trendAmount.toLocaleString('en-IN')}/{t('common_month')} {forecast.trend === 'increasing' ? '↑' : forecast.trend === 'decreasing' ? '↓' : '→'}
          </div>
        </motion.div>
        <motion.div className="stat-card" variants={fadeInUp} {...cardHoverProps}>
          <div className="stat-label">{t('fore_three_month_est')}</div>
          <div className="stat-value">₹{forecast.forecasted.reduce((s, v) => s + v, 0).toLocaleString('en-IN')}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>{t('fore_next_3_months')}</div>
        </motion.div>
      </motion.div>

      {/* Chart */}
      <motion.div className="card mt-3" variants={fadeInUp} {...cardHoverProps}>
        <div className="card-header">
          <div className="card-title">📈 {t('fore_chart_title')}</div>
        </div>
        <div className="chart-container" style={{ height: 360 }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </motion.div>

      {/* Historical Data */}
      <motion.div className="card mt-3" variants={fadeInUp} {...cardHoverProps}>
        <div className="card-title mb-2">📋 {t('fore_breakdown_title')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {forecast.historical.map((amount, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1);
            const isCurrentMonth = i === 2;
            return (
              <motion.div
                key={i}
                className="scenario-box"
                style={isCurrentMonth ? { background: '#FFF5EC', borderColor: 'rgba(252,108,38,0.3)' } : { background: '#FFFFFF', borderColor: 'rgba(0,0,0,0.06)' }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
              >
                <div className="scenario-label">{getMonthName(d.getMonth())}</div>
                <div className="scenario-value" style={{ fontSize: 20 }}>₹{amount.toLocaleString('en-IN')}</div>
                <div className="scenario-note">{isCurrentMonth ? t('fore_current_note') : t('fore_actual_note')}</div>
              </motion.div>
            );
          })}
          {forecast.forecasted.map((amount, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
            return (
              <motion.div
                key={`f${i}`}
                className="scenario-box"
                style={{ background: '#FFFDF9', borderColor: 'rgba(217,119,6,0.2)' }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
              >
                <div className="scenario-label">{getMonthName(d.getMonth())}</div>
                <div className="scenario-value" style={{ fontSize: 20, color: '#D97706' }}>₹{amount.toLocaleString('en-IN')}</div>
                <div className="scenario-note">{t('fore_estimated')}</div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <div className="disclaimer mt-3">
        {t('fore_disclaimer')}
      </div>
    </motion.div>
  );
}

