import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'pt', label: 'PT', flag: '🇧🇷' }
  ];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[0];

  if (compact) {
    return (
      <div className="language-switcher compact">
        <button
          onClick={() => {
            const nextLang = languages.find(lang => lang.code !== i18n.language) || languages[0];
            handleLanguageChange(nextLang.code);
          }}
          className="lang-button compact active"
          title={`Switch language (Current: ${currentLang.label})`}
        >
          <span className="flag text-sm">{currentLang.flag}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="language-switcher">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`lang-button ${i18n.language === lang.code ? 'active' : ''}`}
          title={`Switch to ${lang.label}`}
        >
          <span className="flag">{lang.flag}</span>
          <span className="lang-code">{lang.label}</span>
        </button>
      ))}
    </div>
  );
}