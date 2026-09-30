import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../utils/demoData';
import Papa from 'papaparse';
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

// Simple merchant-to-category mapping
const MERCHANT_MAP = {
  swiggy: 'food', zomato: 'food', dominos: 'food', mcdonalds: 'food', kfc: 'food',
  grocery: 'food', restaurant: 'food', cafe: 'food', food: 'food', starbucks: 'food',
  bigbasket: 'food', blinkit: 'food', zepto: 'food', dunzo: 'food',
  amazon: 'shopping', flipkart: 'shopping', myntra: 'shopping', ajio: 'shopping',
  nike: 'shopping', market: 'shopping', store: 'shopping', shop: 'shopping', mall: 'shopping',
  uber: 'travel', ola: 'travel', metro: 'travel', petrol: 'travel', fuel: 'travel',
  rapido: 'travel', irctc: 'travel', railways: 'travel', flight: 'travel',
  electricity: 'bills', recharge: 'bills', wifi: 'bills', broadband: 'bills',
  jio: 'bills', airtel: 'bills', vodafone: 'bills', rent: 'bills',
  udemy: 'education', coursera: 'education', books: 'education', course: 'education',
  college: 'education', school: 'education', tuition: 'education',
  netflix: 'entertainment', spotify: 'entertainment', movie: 'entertainment',
  hotstar: 'entertainment', prime: 'entertainment', game: 'entertainment',
  pharmacy: 'health', hospital: 'health', doctor: 'health', gym: 'health',
  medicine: 'health', medical: 'health', apollo: 'health',
};

function categorizeTransaction(description) {
  const lower = description.toLowerCase();
  for (const [keyword, category] of Object.entries(MERCHANT_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return 'other';
}

export default function CSVImport() {
  const { dispatch } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);
  const [imported, setImported] = useState(false);

  const handleFile = useCallback((file) => {
    setError(null);
    setParsed(null);
    setImported(false);

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Parsing error: ${results.errors[0].message}`);
          return;
        }

        const transactions = results.data.map((row, i) => {
          // Try to find amount, date, and description columns
          const amount = parseFloat(
            row.amount || row.Amount || row.AMOUNT || row.debit || row.Debit || row.DEBIT || row['Transaction Amount'] || row.value || 0
          );

          const dateStr = row.date || row.Date || row.DATE || row['Transaction Date'] || row['Value Date'] || row.timestamp || '';
          const description = row.description || row.Description || row.DESCRIPTION || row.merchant || row.Merchant || row.narration || row.Narration || row.NARRATION || row.particular || row.Particular || row.name || row.Name || `Transaction ${i + 1}`;

          let date;
          try {
            date = new Date(dateStr);
            if (isNaN(date.getTime())) date = new Date();
          } catch {
            date = new Date();
          }

          const category = categorizeTransaction(description);

          return {
            id: Date.now() + i,
            name: description.trim().substring(0, 50),
            amount: Math.abs(amount),
            category,
            date: date.toISOString(),
            note: 'Imported from CSV',
          };
        }).filter(t => t.amount > 0);

        if (transactions.length === 0) {
          setError('No valid transactions found. Please ensure your CSV has columns for amount and description.');
          return;
        }

        setParsed(transactions);
      },
      error: (err) => {
        setError(`Failed to parse file: ${err.message}`);
      },
    });
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    if (parsed) {
      dispatch({ type: 'IMPORT_EXPENSES', payload: parsed });
      setImported(true);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Import Statement / CSV</h2>
        <p className="subtitle">Upload a bank statement or CSV file to automatically import and categorize transactions</p>
      </div>

      {/* Upload Area */}
      <div className="card mb-3">
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('csv-input').click()}
        >
          <div className="drop-icon">📄</div>
          <h4>Drop your CSV file here</h4>
          <p>or click to browse</p>
          <p style={{ marginTop: 12, fontSize: 12 }}>Supports standard CSV with columns for amount, date, and description/merchant</p>
          <input
            id="csv-input"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </div>
      </div>

      {error && (
        <div className="card mb-2" style={{ borderLeft: '3px solid var(--danger)' }}>
          <div className="flex items-center gap-1">
            <AlertTriangle size={18} color="var(--danger)" />
            <span style={{ color: 'var(--danger)', fontWeight: 500 }}>{error}</span>
          </div>
        </div>
      )}

      {imported && (
        <div className="card mb-2" style={{ borderLeft: '3px solid var(--success)' }}>
          <div className="flex items-center gap-1">
            <CheckCircle size={18} color="var(--success)" />
            <span style={{ color: 'var(--success)', fontWeight: 500 }}>
              Successfully imported {parsed.length} transactions!
            </span>
          </div>
        </div>
      )}

      {/* Preview */}
      {parsed && !imported && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><FileText size={16} /> Preview — {parsed.length} transactions found</div>
            <button className="btn btn-primary" onClick={handleImport}>
              <Upload size={14} /> Import All
            </button>
          </div>

          <ul className="expense-list">
            {parsed.slice(0, 20).map((t, i) => {
              const cat = CATEGORIES.find(c => c.id === t.category);
              return (
                <li key={i} className="expense-item">
                  <div className="expense-cat-icon" style={{ background: `${cat?.color}20` }}>
                    {cat?.icon}
                  </div>
                  <div className="expense-info">
                    <div className="expense-name">{t.name}</div>
                    <div className="expense-meta">
                      <span className="tag" style={{ background: `${cat?.color}20`, color: cat?.color }}>{cat?.name}</span>
                      <span>{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                  <div className="expense-amount">₹{t.amount.toLocaleString('en-IN')}</div>
                </li>
              );
            })}
          </ul>
          {parsed.length > 20 && (
            <p className="text-muted mt-2" style={{ textAlign: 'center', fontSize: 13 }}>
              ... and {parsed.length - 20} more transactions
            </p>
          )}

          <div className="disclaimer mt-2">
            ⚠️ Categories are auto-assigned based on merchant names. You can edit categories after import.
          </div>
        </div>
      )}

      {/* How it works */}
      {!parsed && !error && (
        <div className="card">
          <div className="card-title mb-2">📋 How It Works</div>
          <div className="privacy-grid">
            <div className="privacy-card">
              <div className="privacy-icon">1️⃣</div>
              <h4>Upload CSV</h4>
              <p>Export a transaction CSV from your bank's app or website. Upload it here.</p>
            </div>
            <div className="privacy-card">
              <div className="privacy-icon">2️⃣</div>
              <h4>Auto-Categorize</h4>
              <p>Our AI automatically assigns categories based on merchant names and descriptions.</p>
            </div>
            <div className="privacy-card">
              <div className="privacy-icon">3️⃣</div>
              <h4>Review & Import</h4>
              <p>Preview the categorized transactions and import them into your expense tracker.</p>
            </div>
          </div>

          <div className="disclaimer mt-3">
            🔒 Your file is processed entirely in your browser. No data is sent to any server. We never ask for your bank credentials, UPI PIN, or passwords.
          </div>
        </div>
      )}
    </div>
  );
}
