/**
 * Support Page - Comprehensive Help Desk for OSIA UIN Generator
 * Includes AI Chat, Knowledge Base, FAQ, and Calendly Scheduling
 */

import { useState, useEffect, useRef } from 'react';
import './SupportPage.css';

const API_BASE = '/api/assistant';

// FAQ Data
const faqCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    questions: [
      {
        q: 'What is the OSIA UIN Generator?',
        a: 'The OSIA UIN Generator is a production-grade tool for generating Unique Identification Numbers (UINs) based on the Open Standards for Identity APIs (OSIA) v6.1.0 specification. It is designed for governments implementing national identity systems, civil registration, and population registries.'
      },
      {
        q: 'How do I generate my first UIN?',
        a: 'Navigate to the "Generate" tab, select "Foundational" mode (recommended for most use cases), and click "Generate UIN". The system will create a cryptographically secure, random identifier with a built-in checksum for validation.'
      },
      {
        q: 'What generation mode should I use?',
        a: 'For national ID systems, we strongly recommend "Foundational" mode. It provides maximum entropy (randomness), contains no embedded personal information (privacy by design), and uses hardware-based true random number generation when available.'
      }
    ]
  },
  {
    id: 'technical',
    title: 'Technical Questions',
    icon: '⚙️',
    questions: [
      {
        q: 'How many digits should my UIN have?',
        a: 'The general rule is: 10^(digits) > 10 × population × 100 years. For India (1.4B population): minimum 12 digits. For a small nation (10M): minimum 9 digits. The default 19-character alphanumeric format provides virtually unlimited capacity.'
      },
      {
        q: 'What is the difference between HSM TRNG and software PRNG?',
        a: 'HSM (Hardware Security Module) TRNG uses physical phenomena like thermal noise for true randomness - mathematically unpredictable and FIPS certified. Software PRNG is algorithm-based and deterministic. For national identity systems, always use HSM TRNG in production.'
      },
      {
        q: 'How does sector tokenization work?',
        a: 'Sector tokenization derives different, unlinkable identifiers for each government sector (health, tax, education). Using HMAC-SHA256 with sector-specific secrets, it prevents cross-sector tracking while allowing each sector to identify the same person within their domain.'
      },
      {
        q: 'What checksum algorithm is used?',
        a: 'We use ISO 7064 Mod 37,36 checksum algorithm. It detects all single-character errors and transposition errors with 100% accuracy. The last character of every UIN is the checksum digit.'
      }
    ]
  },
  {
    id: 'security',
    title: 'Security & Compliance',
    icon: '🔒',
    questions: [
      {
        q: 'Is this system GDPR compliant?',
        a: 'Yes. The system supports GDPR requirements through: consent token management (right to access/erasure), sector tokenization (data minimization), audit logging (accountability), and no embedded PII in UINs (privacy by design).'
      },
      {
        q: 'What HSM providers are supported?',
        a: 'We support: Thales Luna, SafeNet ProtectServer, Utimaco CryptoServer, nCipher/Entrust nShield, AWS CloudHSM, Azure Dedicated HSM, and YubiHSM 2. All production HSMs are FIPS 140-2 Level 3 certified.'
      },
      {
        q: 'How are secrets protected?',
        a: 'Sector secrets are stored in HashiCorp Vault with AppRole authentication. HSM keys are non-extractable (never leave the hardware). All audit logs are append-only and immutable.'
      }
    ]
  },
  {
    id: 'implementation',
    title: 'Implementation',
    icon: '🏗️',
    questions: [
      {
        q: 'How do I integrate with my civil registration system?',
        a: 'Use the REST API endpoints: POST /v1/uin for OSIA-compliant generation, POST /uin/claim to reserve from pool, POST /uin/assign to bind to a person. The API returns JSON, JWT, or JSON-LD formats.'
      },
      {
        q: 'What is the pre-generation pool?',
        a: 'The pool is a pre-generated inventory of UINs ready for instant assignment. Benefits include: zero generation latency during registration, offline capability, quality assurance, and inventory forecasting. We recommend maintaining 3-6 months of inventory.'
      },
      {
        q: 'Can I migrate from a legacy ID system?',
        a: 'Yes. Options include: (A) Assign new UINs to all records, (B) Convert existing IDs to new format, (C) Hybrid approach with legacy reference. Contact us for a migration assessment and planning session.'
      }
    ]
  }
];

// Knowledge Base Articles
const knowledgeBase = [
  {
    id: 'osia-overview',
    title: 'Understanding OSIA Standards',
    category: 'Concepts',
    readTime: '5 min',
    excerpt: 'Learn about Open Standards for Identity APIs and how they enable interoperability between government identity systems.'
  },
  {
    id: 'uin-lifecycle',
    title: 'UIN Lifecycle Management',
    category: 'Technical',
    readTime: '8 min',
    excerpt: 'Complete guide to UIN states: AVAILABLE → PREASSIGNED → ASSIGNED → RETIRED/REVOKED.'
  },
  {
    id: 'hsm-integration',
    title: 'HSM Integration Guide',
    category: 'Security',
    readTime: '12 min',
    excerpt: 'Step-by-step guide for integrating Hardware Security Modules for cryptographic operations.'
  },
  {
    id: 'sector-tokens',
    title: 'Privacy-Preserving Sector Tokens',
    category: 'Privacy',
    readTime: '10 min',
    excerpt: 'How to implement unlinkable sector-specific identifiers that prevent cross-department tracking.'
  },
  {
    id: 'api-quickstart',
    title: 'API Quick Start Guide',
    category: 'Development',
    readTime: '7 min',
    excerpt: 'Get up and running with the OSIA UIN Generator API in under 15 minutes.'
  },
  {
    id: 'vault-setup',
    title: 'HashiCorp Vault Configuration',
    category: 'Security',
    readTime: '15 min',
    excerpt: 'Configure centralized secret management for sector secrets and database credentials.'
  }
];

export default function SupportPage() {
  const [activeSection, setActiveSection] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [calendlyLoaded, setCalendlyLoaded] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const calendlyRef = useRef(null);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm Anna, your dedicated AI assistant for the OSIA UIN Generator.

I can help you with:
• Understanding UIN generation modes and best practices
• Technical guidance on HSM integration and security
• Implementation strategies for national ID systems
• API integration and troubleshooting
• Compliance and privacy requirements

How can I assist you today?`,
        timestamp: new Date()
      }]);
    }
  }, [messages.length]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load Calendly script
  useEffect(() => {
    if (activeSection === 'schedule' && !calendlyLoaded) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        setCalendlyLoaded(true);
        // Initialize Calendly widget
        if (window.Calendly && calendlyRef.current) {
          window.Calendly.initInlineWidget({
            url: 'https://calendly.com/secureidentityalliance',
            parentElement: calendlyRef.current,
            prefill: {},
            utm: {}
          });
        }
      };
      document.body.appendChild(script);

      // Load Calendly CSS
      const link = document.createElement('link');
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [activeSection, calendlyLoaded]);

  // Send message
  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          sessionId: sessionId,
          context: 'support'
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      if (data.sessionId) setSessionId(data.sessionId);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again or use the FAQ section below.',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickQuestion = (question) => {
    sendMessage(question);
  };

  // Filter FAQ based on search
  const filteredFaq = faqCategories.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q =>
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  // Format message content
  const formatMessage = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('•') || line.startsWith('-')) {
        return <div key={idx} className="message-bullet">{line}</div>;
      }
      if (line.trim() === '') {
        return <br key={idx} />;
      }
      return <p key={idx} className="message-line">{line}</p>;
    });
  };

  return (
    <div className="support-page">
      {/* Hero Section */}
      <div className="support-hero">
        <div className="hero-content">
          <img src="/anna-avatar.png" alt="Anna" className="hero-avatar" />
          <div className="hero-text">
            <h1>How can we help you?</h1>
            <p>Get instant answers from Anna, our AI assistant, or explore our comprehensive resources below.</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="support-nav">
        <button
          className={`support-nav-btn ${activeSection === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveSection('chat')}
        >
          <span className="nav-icon">💬</span>
          Ask Anna
        </button>
        <button
          className={`support-nav-btn ${activeSection === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveSection('faq')}
        >
          <span className="nav-icon">❓</span>
          FAQ
        </button>
        <button
          className={`support-nav-btn ${activeSection === 'knowledge' ? 'active' : ''}`}
          onClick={() => setActiveSection('knowledge')}
        >
          <span className="nav-icon">📚</span>
          Knowledge Base
        </button>
        <button
          className={`support-nav-btn ${activeSection === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveSection('schedule')}
        >
          <span className="nav-icon">📅</span>
          Schedule Consultation
        </button>
        <button
          className={`support-nav-btn ${activeSection === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveSection('contact')}
        >
          <span className="nav-icon">✉️</span>
          Contact
        </button>
      </div>

      {/* Content Sections */}
      <div className="support-content">
        {/* AI Chat Section */}
        {activeSection === 'chat' && (
          <div className="chat-section">
            <div className="chat-container">
              {/* Quick Questions */}
              <div className="quick-questions">
                <h3>Popular Questions</h3>
                <div className="quick-question-grid">
                  <button onClick={() => handleQuickQuestion('What UIN length should I use for my country?')}>
                    UIN length recommendations
                  </button>
                  <button onClick={() => handleQuickQuestion('How do I set up HSM integration?')}>
                    HSM setup guide
                  </button>
                  <button onClick={() => handleQuickQuestion('Explain sector tokenization')}>
                    Sector tokenization
                  </button>
                  <button onClick={() => handleQuickQuestion('How do I migrate from a legacy ID system?')}>
                    Legacy migration
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages-container">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`chat-msg ${msg.role} ${msg.isError ? 'error' : ''}`}>
                    {msg.role === 'assistant' && (
                      <img src="/anna-avatar.png" alt="Anna" className="msg-avatar" />
                    )}
                    <div className="msg-content">
                      {formatMessage(msg.content)}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="chat-msg assistant">
                    <img src="/anna-avatar.png" alt="Anna" className="msg-avatar" />
                    <div className="msg-content">
                      <div className="typing-dots">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form className="chat-input-container" onSubmit={handleSubmit}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask me anything about OSIA UIN Generator..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !inputValue.trim()}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        {activeSection === 'faq' && (
          <div className="faq-section">
            <div className="faq-search">
              <input
                type="text"
                placeholder="Search frequently asked questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="faq-categories">
              {filteredFaq.map(category => (
                <div key={category.id} className="faq-category">
                  <h3>
                    <span className="category-icon">{category.icon}</span>
                    {category.title}
                  </h3>
                  <div className="faq-list">
                    {category.questions.map((item, idx) => (
                      <div
                        key={idx}
                        className={`faq-item ${expandedFaq === `${category.id}-${idx}` ? 'expanded' : ''}`}
                      >
                        <button
                          className="faq-question"
                          onClick={() => setExpandedFaq(
                            expandedFaq === `${category.id}-${idx}` ? null : `${category.id}-${idx}`
                          )}
                        >
                          <span>{item.q}</span>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 9l-7 7-7-7"/>
                          </svg>
                        </button>
                        {expandedFaq === `${category.id}-${idx}` && (
                          <div className="faq-answer">
                            <p>{item.a}</p>
                            <button
                              className="ask-anna-btn"
                              onClick={() => {
                                setActiveSection('chat');
                                handleQuickQuestion(`Tell me more about: ${item.q}`);
                              }}
                            >
                              Ask Anna for more details →
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Knowledge Base Section */}
        {activeSection === 'knowledge' && (
          <div className="knowledge-section">
            <h2>Knowledge Base</h2>
            <p className="section-desc">In-depth articles and guides for implementing identity systems</p>

            <div className="knowledge-grid">
              {knowledgeBase.map(article => (
                <div key={article.id} className="knowledge-card">
                  <div className="knowledge-meta">
                    <span className="knowledge-category">{article.category}</span>
                    <span className="knowledge-time">{article.readTime}</span>
                  </div>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <button
                    className="read-more-btn"
                    onClick={() => {
                      setActiveSection('chat');
                      handleQuickQuestion(`Explain in detail: ${article.title}`);
                    }}
                  >
                    Ask Anna about this →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Consultation Section */}
        {activeSection === 'schedule' && (
          <div className="schedule-section">
            <div className="schedule-header">
              <h2>Schedule a Consultation</h2>
              <p>Book a one-on-one session with our identity systems experts to discuss your specific requirements.</p>
            </div>

            <div className="schedule-options">
              <div className="schedule-card">
                <div className="schedule-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect x="8" y="8" width="32" height="32" rx="8" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
                    <path d="M16 20h16M16 24h16M16 28h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="34" cy="34" r="8" fill="var(--primary)" stroke="var(--bg-card)" strokeWidth="2"/>
                    <path d="M34 30v4l2.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Technical Assessment</h3>
                <p>30-minute session to evaluate your current infrastructure and recommend integration approaches.</p>
                <ul>
                  <li>Infrastructure review</li>
                  <li>HSM compatibility check</li>
                  <li>API integration planning</li>
                </ul>
                <a
                  href="https://calendly.com/secureidentityalliance/technical-assessment"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="schedule-btn"
                >
                  Book Technical Assessment
                </a>
              </div>

              <div className="schedule-card featured">
                <div className="schedule-badge">Most Popular</div>
                <div className="schedule-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path d="M24 6L8 14v10c0 10 7 19 16 22 9-3 16-12 16-22V14L24 6z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
                    <path d="M18 24l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="34" cy="34" r="8" fill="var(--primary)" stroke="var(--bg-card)" strokeWidth="2"/>
                    <path d="M31 34h6M34 31v6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>Implementation Planning</h3>
                <p>60-minute deep-dive into your national ID modernization project.</p>
                <ul>
                  <li>Requirements gathering</li>
                  <li>Architecture design</li>
                  <li>Migration strategy</li>
                  <li>Security assessment</li>
                </ul>
                <a
                  href="https://calendly.com/secureidentityalliance/implementation-planning"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="schedule-btn primary"
                >
                  Book Implementation Session
                </a>
              </div>

              <div className="schedule-card">
                <div className="schedule-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect x="14" y="20" width="20" height="18" rx="3" stroke="currentColor" strokeWidth="2.5"/>
                    <path d="M19 20v-5a5 5 0 0110 0v5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="24" cy="29" r="2.5" fill="currentColor"/>
                    <path d="M24 31.5v3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="36" cy="12" r="8" fill="var(--primary)" stroke="var(--bg-card)" strokeWidth="2"/>
                    <path d="M33 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Security Review</h3>
                <p>45-minute session focused on cryptographic security and compliance requirements.</p>
                <ul>
                  <li>HSM configuration review</li>
                  <li>Key management strategy</li>
                  <li>Compliance mapping (GDPR, etc.)</li>
                </ul>
                <a
                  href="https://calendly.com/secureidentityalliance/security-review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="schedule-btn"
                >
                  Book Security Review
                </a>
              </div>
            </div>

            {/* Calendly Embed */}
            <div className="calendly-embed">
              <h3>Or choose a time below</h3>
              <div
                ref={calendlyRef}
                className="calendly-inline-widget"
                style={{ minWidth: '320px', height: '700px' }}
              >
                {!calendlyLoaded && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                    Loading calendar...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact Section */}
        {activeSection === 'contact' && (
          <div className="contact-section">
            <h2>Get in Touch</h2>
            <p className="section-desc">We're here to help with your identity system implementation</p>

            <div className="contact-grid">
              <div className="contact-card">
                <div className="contact-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h3>General Inquiries</h3>
                <p>For questions about OSIA and implementation support</p>
                <a href="mailto:info@secureidentityalliance.org">info@secureidentityalliance.org</a>
              </div>

              <div className="contact-card">
                <div className="contact-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <h3>GitHub Repository</h3>
                <p>Report issues, contribute, or view source code</p>
                <a href="https://github.com/tunjidurodola/osia_uin_generator" target="_blank" rel="noopener noreferrer">
                  github.com/tunjidurodola/osia_uin_generator
                </a>
              </div>

              <div className="contact-card">
                <div className="contact-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <h3>OSIA Documentation</h3>
                <p>Official specification and technical guides</p>
                <a href="https://osia.readthedocs.io" target="_blank" rel="noopener noreferrer">
                  osia.readthedocs.io
                </a>
              </div>

              <div className="contact-card">
                <div className="contact-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                  </svg>
                </div>
                <h3>Secure Identity Alliance</h3>
                <p>Learn more about SIA and OSIA standards</p>
                <a href="https://secureidentityalliance.org" target="_blank" rel="noopener noreferrer">
                  secureidentityalliance.org
                </a>
              </div>
            </div>

            <div className="org-info">
              <img src="/sia-logo.png" alt="Secure Identity Alliance" className="org-logo" onError={(e) => e.target.style.display = 'none'} />
              <div className="org-details">
                <h3>Secure Identity Alliance</h3>
                <p>
                  The Secure Identity Alliance is a global industry association that promotes the responsible,
                  sustainable use of identity systems. OSIA is developed in collaboration with governments
                  and industry experts worldwide.
                </p>
                <a href="https://secureidentityalliance.org" target="_blank" rel="noopener noreferrer">
                  Learn more about SIA →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
