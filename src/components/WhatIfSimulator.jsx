import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import LanguageSwitcher from './LanguageSwitcher';
import { calculateWhatIf } from '../utils/aiEngine';
import { CATEGORIES } from '../utils/demoData';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { GitCompareArrows, Zap, TrendingUp, Calculator } from 'lucide-react';

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
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="flex items-center gap-1">
            <h2>{t('whatif_title')}</h2>
            <span className="ai-badge"><Zap size={12} /> Interactive</span>
          </div>
          <p className="subtitle">{t('whatif_subtitle')}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {/* Preset Scenarios */}
      <div className="card mb-3">
        <div className="card-title mb-2">⚡ {t('whatif_presets_title')}</div>
        <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
          {presets.map((preset, i) => (
            <button
              key={i}
              className={`btn ${activePreset === i ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => handlePreset(preset, i)}
            >
              {preset.icon} {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="simulator-grid">
        {/* Input Panel */}
        <div className="simulator-panel">
          <div className="card-title mb-2"><Calculator size={16} /> {language === 'kn' ? 'ಸನ್ನಿವೇಶ ಸಂರಚಿಸಿ' : language === 'hi' ? 'परिदृश्य निर्धारित करें' : 'Configure Scenario'}</div>

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
            <label className="form-label">Time Period (Months): {months}</label>
            <input
              type="range"
              min="1"
              max="60"
              value={months}
              onChange={e => setMonths(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#FC6C26' }}
            />
            <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>1 month</span>
              <span>60 months</span>
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
            {language === 'kn'
              ? 'ℹ️ ಇವು ಊಹಿಸಲಾದ ಆದಾಯದ ಮೇಲಿನ ವಿವರಣಾತ್ಮಕ ಸನ್ನಿವೇಶಗಳಾಗಿವೆ. ನೈಜ ಹೂಡಿಕೆಯ ಆದಾಯಗಳು ಖಾತರಿಯಿಲ್ಲ ಮತ್ತು ಮಾರುಕಟ್ಟೆಗೆ ಒಳಪಟ್ಟಿರುತ್ತವೆ.'
              : language === 'hi'
              ? 'ℹ️ ये अनुमानित रिटर्न पर आधारित उदाहरणात्मक परिदृश्य हैं। वास्तविक निवेश रिटर्न की गारंटी नहीं है और यह भिन्न हो सकता है।'
              : 'ℹ️ These are illustrative scenarios based on assumed returns. Actual investment returns are not guaranteed and may vary significantly.'}
          </div>
        </div>

        {/* Results Panel */}
        <div className="simulator-panel">
          <div className="card-title mb-2"><TrendingUp size={16} /> {language === 'kn' ? 'ಸನ್ನಿವೇಶದ ಫಲಿತಾಂಶಗಳು' : language === 'hi' ? 'परिदृश्य परिणाम' : 'Scenario Results'}</div>

          <div className="scenario-result">
            <div className="scenario-box">
              <div className="scenario-label">{language === 'kn' ? 'ಮಾಸಿಕ' : language === 'hi' ? 'मासिक' : 'Monthly'}</div>
              <div className="scenario-value">₹{amount.toLocaleString('en-IN')}</div>
              <div className="scenario-note">/{t('common_month')}</div>
            </div>
            <div className="scenario-box">
              <div className="scenario-label">{t('whatif_total_saved')}</div>
              <div className="scenario-value">₹{result.totalSaved.toLocaleString('en-IN')}</div>
              <div className="scenario-note">{months} {language === 'kn' ? 'ತಿಂಗಳುಗಳು' : language === 'hi' ? 'महीने' : 'months'}</div>
            </div>
            <div className="scenario-box" style={{ background: '#FFFDF9', borderColor: 'rgba(217, 119, 6, 0.25)' }}>
              <div className="scenario-label">{language === 'kn' ? 'FD ಮೌಲ್ಯ (ಅಂದಾಜು)' : language === 'hi' ? 'FD मूल्य (अनुमानित)' : 'FD Value (est.)'}</div>
              <div className="scenario-value" style={{ color: 'var(--accent-dark)' }}>₹{result.fdValue.toLocaleString('en-IN')}</div>
              <div className="scenario-note">@7% p.a.</div>
            </div>
            <div className="scenario-box" style={{ background: 'rgba(5, 150, 105, 0.06)', borderColor: 'rgba(5, 150, 105, 0.2)' }}>
              <div className="scenario-label">{language === 'kn' ? 'ಹೂಡಿಕೆ (ಅಂದಾಜು)' : language === 'hi' ? 'निवेश (अनुमानित)' : 'Investment (est.)'}</div>
              <div className="scenario-value" style={{ color: 'var(--success)' }}>₹{result.investedValue.toLocaleString('en-IN')}</div>
              <div className="scenario-note">@{annualReturn}% p.a.</div>
            </div>
          </div>

          {result.estimatedGrowth > 0 && (
            <div style={{
              marginTop: 16, padding: '14px 18px', background: '#FFF7F0',
              borderRadius: 'var(--radius-md)', border: '1px solid rgba(252,108,38,0.2)'
            }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {language === 'kn'
                  ? `💡 ತಿಂಗಳಿಗೆ ₹${amount.toLocaleString('en-IN')} ರಂತೆ ${months} ತಿಂಗಳು ಉಳಿಸುವ ಮೂಲಕ, ನಿಮ್ಮ ಒಟ್ಟು ₹${result.totalSaved.toLocaleString('en-IN')} ನಗದು ಸುಮಾರು ₹${result.investedValue.toLocaleString('en-IN')} ಆಗಿ ಬೆಳೆಯಬಹುದು — ಅಂದಾಜು ಗಳಿಕೆ ₹${result.estimatedGrowth.toLocaleString('en-IN')} (${annualReturn}% ಆದಾಯದಲ್ಲಿ).`
                  : language === 'hi'
                  ? `💡 प्रति माह ₹${amount.toLocaleString('en-IN')} बचाकर ${months} महीनों में, आपकी कुल ₹${result.totalSaved.toLocaleString('en-IN')} की बचत अनुमानित रूप से ₹${result.investedValue.toLocaleString('en-IN')} तक बढ़ सकती है — ${annualReturn}% वार्षिक रिटर्न पर लगभग ₹${result.estimatedGrowth.toLocaleString('en-IN')} का लाभ!`
                  : `💡 By saving ₹${amount.toLocaleString('en-IN')}/month for ${months} months, your total saved amount of ₹${result.totalSaved.toLocaleString('en-IN')} could illustratively grow to ₹${result.investedValue.toLocaleString('en-IN')} — an estimated gain of ₹${result.estimatedGrowth.toLocaleString('en-IN')} under the assumed ${annualReturn}% annual return.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="card mt-3">
        <div className="card-header">
          <div className="card-title">📈 Growth Over Time</div>
        </div>
        <div className="chart-container" style={{ height: 300 }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
