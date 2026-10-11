import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculateFutureValue } from '../utils/aiEngine';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Calculator } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function FutureValueCalc() {
  const { t, language } = useApp();
  const [initialAmount, setInitialAmount] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(2000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [years, setYears] = useState(10);
  const [compounding, setCompounding] = useState('annually'); // 'annually' | 'monthly'

  const result = useMemo(() => calculateFutureValue({
    initialAmount,
    monthlyContribution,
    annualReturn,
    years,
    compounding,
  }), [initialAmount, monthlyContribution, annualReturn, years, compounding]);

  const applyPreset = (preset) => {
    setInitialAmount(preset.initial);
    setMonthlyContribution(preset.monthly);
    setAnnualReturn(preset.rate);
    setYears(preset.years);
    if (preset.compounding) setCompounding(preset.compounding);
  };

  const chartData = useMemo(() => ({
    labels: result.yearlyData.map(d => `${t('common_year')} ${d.year}`),
    datasets: [
      {
        label: t('calc_total_invested'),
        data: result.yearlyData.map(d => d.invested),
        borderColor: '#D97706',
        backgroundColor: 'rgba(217, 119, 6, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: t('calc_est_fv'),
        data: result.yearlyData.map(d => d.value),
        borderColor: '#FC6C26',
        backgroundColor: 'rgba(252, 108, 38, 0.12)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  }), [result, language, t]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8E877F', font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        ticks: {
          color: '#8E877F', font: { size: 11 },
          callback: v => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}k`
        },
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

  const compoundingLabel = compounding === 'annually' ? t('common_annual') : t('common_monthly');

  return (
    <div>
      <div className="page-header">
        <h2>{t('calc_title')}</h2>
        <p className="subtitle">{t('calc_subtitle')}</p>
      </div>

      {/* Benchmark Scenarios Bar */}
      <div className="card mb-3">
        <div className="card-title mb-2">🎯 {t('calc_benchmarks_title')}</div>
        <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => applyPreset({ initial: 5000, monthly: 0, rate: 10, years: 10, compounding: 'annually' })}
          >
            {t('calc_preset_1')}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => applyPreset({ initial: 5000, monthly: 0, rate: 10, years: 5, compounding: 'annually' })}
          >
            {t('calc_preset_2')}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => applyPreset({ initial: 5000, monthly: 0, rate: 10, years: 20, compounding: 'annually' })}
          >
            {t('calc_preset_3')}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => applyPreset({ initial: 10000, monthly: 2000, rate: 12, years: 10, compounding: 'annually' })}
          >
            {t('calc_preset_4')}
          </button>
        </div>
      </div>

      <div className="simulator-grid">
        {/* Inputs */}
        <div className="simulator-panel">
          <div className="card-title mb-2"><Calculator size={16} /> {t('calc_inputs_title')}</div>

          <div className="form-group">
            <label className="form-label">{t('calc_initial_amount')}</label>
            <input className="form-input" type="number" value={initialAmount} onChange={e => setInitialAmount(Math.max(0, parseInt(e.target.value) || 0))} min="0" step="500" />
            <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>₹0 (SIP)</span>
              <span>₹5,000</span>
              <span>₹50,000</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('calc_monthly_contrib', { amount: monthlyContribution.toLocaleString('en-IN') })}</label>
            <input type="range" min="0" max="50000" step="500" value={monthlyContribution} onChange={e => setMonthlyContribution(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#FC6C26' }} />
            <div className="flex items-center gap-1 mt-1">
              <input className="form-input" type="number" value={monthlyContribution} onChange={e => setMonthlyContribution(Math.max(0, parseInt(e.target.value) || 0))} min="0" style={{ flex: 1 }} />
              {monthlyContribution > 0 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMonthlyContribution(0)} title="Set to 0 for pure one-time calculation">
                  {t('calc_clear_zero')}
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('calc_return_rate', { rate: annualReturn })}</label>
            <input type="range" min="0" max="25" step="0.5" value={annualReturn} onChange={e => setAnnualReturn(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#FFF4D6' }} />
            <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>0%</span>
              <span>FD ~7%</span>
              <span>Equity ~10-12%</span>
              <span>25%</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('calc_time_period', { years, unit: years === 1 ? t('common_year') : t('common_years') })}</label>
            <input type="range" min="1" max="30" value={years} onChange={e => setYears(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#FC6C26' }} />
            <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>1 {t('common_year')}</span>
              <span>5 {t('common_years')}</span>
              <span>10 {t('common_years')}</span>
              <span>20 {t('common_years')}</span>
              <span>30 {t('common_years')}</span>
            </div>
          </div>

          {/* Explicit Compounding Frequency */}
          <div className="form-group" style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <label className="form-label" style={{ marginBottom: 6 }}>{t('calc_freq_label')}</label>
            <div className="btn-group" style={{ width: '100%', display: 'flex' }}>
              <button
                type="button"
                className={`btn btn-sm ${compounding === 'annually' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCompounding('annually')}
                style={{ flex: 1 }}
              >
                {t('calc_freq_annual')}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${compounding === 'monthly' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCompounding('monthly')}
                style={{ flex: 1 }}
              >
                {t('calc_freq_monthly')}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="simulator-panel">
          <div className="card-title mb-2">📊 {t('calc_results_title')}</div>

          <div className="scenario-result">
            <div className="scenario-box">
              <div className="scenario-label">{t('calc_initial_box')}</div>
              <div className="scenario-value" style={{ fontSize: 18, color: 'var(--text-primary)' }}>₹{initialAmount.toLocaleString('en-IN')}</div>
              <div className="scenario-note">{compoundingLabel}</div>
            </div>
            <div className="scenario-box">
              <div className="scenario-label">{t('calc_monthly_added')}</div>
              <div className="scenario-value" style={{ fontSize: 18, color: 'var(--primary)' }}>₹{(monthlyContribution * years * 12).toLocaleString('en-IN')}</div>
              <div className="scenario-note">{monthlyContribution > 0 ? `₹${monthlyContribution.toLocaleString('en-IN')}/${t('common_month')} × ${years * 12}m` : 'None'}</div>
            </div>
            <div className="scenario-box">
              <div className="scenario-label">{t('calc_total_invested')}</div>
              <div className="scenario-value" style={{ fontSize: 18 }}>₹{result.totalInvested.toLocaleString('en-IN')}</div>
              <div className="scenario-note">{t('calc_principal_note')}</div>
            </div>
            <div className="scenario-box" style={{ background: 'rgba(5, 150, 105, 0.06)', borderColor: 'rgba(5, 150, 105, 0.2)' }}>
              <div className="scenario-label">{t('calc_est_growth')}</div>
              <div className="scenario-value" style={{ color: 'var(--success)' }}>₹{result.estimatedGrowth.toLocaleString('en-IN')}</div>
              <div className="scenario-note">{t('calc_gain_note')}</div>
            </div>
          </div>

          {/* Final value highlight */}
          <div style={{
            marginTop: 20, padding: '24px', textAlign: 'center',
            background: 'linear-gradient(135deg, #FFF7F0 0%, #FFF1E3 100%)',
            borderRadius: 'var(--radius-lg)', border: '1px solid rgba(252, 108, 38, 0.25)',
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{t('calc_est_fv')}</div>
            <div style={{ fontFamily: "'Space Grotesk'", fontSize: 36, fontWeight: 800, color: 'var(--primary)' }}>
              ₹{result.totalValue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, fontWeight: 500 }}>
              {t('calc_summary_line', {
                years,
                unit: years === 1 ? t('common_year') : t('common_years'),
                rate: annualReturn,
                compounding: compoundingLabel
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card mt-3">
        <div className="card-header">
          <div className="card-title">📈 {t('calc_chart_title')}</div>
        </div>
        <div className="chart-container" style={{ height: 340 }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="disclaimer mt-3">
        {t('calc_disclaimer', { rate: annualReturn, compounding: compoundingLabel })}
      </div>
    </div>
  );
}

