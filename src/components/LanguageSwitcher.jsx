import React from 'react';
import { useTranslation } from '../context/AppContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ compact = false, style = {} }) {
  const { language, setLanguage, languages } = useTranslation();

  return (
    <div
      className="language-switcher"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: '3px 4px',
        gap: 3,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', color: 'var(--text-muted)' }}>
        <Globe size={14} />
      </div>

      {languages.map(lang => {
        const isActive = language === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            style={{
              border: 'none',
              borderRadius: 18,
              padding: compact ? '4px 8px' : '5px 12px',
              fontSize: compact ? 11.5 : 12.5,
              fontWeight: isActive ? 700 : 500,
              background: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? '#FFFFFF' : 'var(--text)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: isActive ? '0 2px 6px rgba(252, 108, 38, 0.3)' : 'none',
            }}
            title={`Switch to ${lang.label} (${lang.native})`}
          >
            <span>{lang.native}</span>
          </button>
        );
      })}
    </div>
  );
}
