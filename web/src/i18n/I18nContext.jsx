/**
 * i18n Context Provider for OSIA UIN Generator
 * Provides language state and translation functions to all components
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, getLanguages } from './translations.js';

// Create the context
const I18nContext = createContext();

// Storage key for persisting language preference
const STORAGE_KEY = 'osia-uin-language';

/**
 * I18n Provider Component
 */
export function I18nProvider({ children, defaultLang = 'en' }) {
  // Initialize from localStorage or browser preference
  const [lang, setLangState] = useState(() => {
    // Check localStorage first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && translations[stored]) {
      return stored;
    }

    // Check browser language
    const browserLang = navigator.language?.split('-')[0];
    if (browserLang && translations[browserLang]) {
      return browserLang;
    }

    return defaultLang;
  });

  // Persist language changes
  const setLang = useCallback((newLang) => {
    if (translations[newLang]) {
      setLangState(newLang);
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    }
  }, []);

  // Set document language on mount and changes
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Translation function with fallback to English
  const t = useCallback((key, replacements = {}) => {
    const keys = key.split('.');
    let value = translations[lang];

    // Navigate to the nested key
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            console.warn(`Translation missing: ${key}`);
            return key; // Return key if not found
          }
        }
        break;
      }
    }

    // Handle string replacements like {count}
    if (typeof value === 'string' && Object.keys(replacements).length > 0) {
      return Object.entries(replacements).reduce(
        (str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), val),
        value
      );
    }

    return value;
  }, [lang]);

  // Get all available languages
  const languages = getLanguages();

  // Get current language metadata
  const currentLanguage = translations[lang]?._meta || translations.en._meta;

  const value = {
    lang,
    setLang,
    t,
    languages,
    currentLanguage,
    translations: translations[lang] || translations.en
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to use i18n context
 */
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

/**
 * Language Switcher Component
 */
export function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, languages, currentLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`language-switcher ${className}`}>
      <button
        className="language-switcher-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="lang-flag">{currentLanguage.flag}</span>
        <span className="lang-code">{lang.toUpperCase()}</span>
        <svg
          className={`lang-arrow ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="language-backdrop" onClick={() => setIsOpen(false)} />
          <ul className="language-dropdown" role="listbox">
            {languages.map(({ code, nativeName, flag }) => (
              <li key={code} role="option" aria-selected={code === lang}>
                <button
                  className={`language-option ${code === lang ? 'active' : ''}`}
                  onClick={() => {
                    setLang(code);
                    setIsOpen(false);
                  }}
                >
                  <span className="lang-flag">{flag}</span>
                  <span className="lang-name">{nativeName}</span>
                  {code === lang && (
                    <svg className="lang-check" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default I18nContext;
