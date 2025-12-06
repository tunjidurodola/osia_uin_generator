/**
 * Anna - AI Support Assistant Chat Widget
 * Provides context-aware help for the OSIA UIN Generator
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import './ChatWidget.css';

const API_BASE = '/api/assistant';

// Conversation starters based on context
const contextStarters = {
  generate: [
    'What generation mode should I use?',
    'Why is HSM TRNG important?',
    'How do I choose UIN length?'
  ],
  pool: [
    'How does pre-generation work?',
    'What do the pool statistics mean?',
    'How long should I keep pre-generated UINs?'
  ],
  lookup: [
    'What do the status codes mean?',
    'How do I view audit history?',
    'Can I reactivate a revoked UIN?'
  ],
  security: [
    'What HSMs are supported?',
    'How does Vault protect secrets?',
    'What is sector tokenization?'
  ],
  documentation: [
    'What is OSIA?',
    'How do I integrate with civil registration?',
    'What are the API endpoints?'
  ],
  default: [
    'What is a UIN and why do I need one?',
    'How do I get started?',
    'What security features are available?'
  ]
};

// Quick tips based on context
const contextTips = {
  generate: 'Tip: Foundational mode is recommended for national ID systems - it provides maximum entropy with no embedded PII.',
  pool: 'Tip: Pre-generate 3-6 months of UIN inventory for smooth operations during peak registration.',
  lookup: 'Tip: UINs flow through states: AVAILABLE → PREASSIGNED → ASSIGNED → RETIRED/REVOKED',
  security: 'Tip: Always use HSM hardware TRNG in production. Software PRNG is only for testing.',
  documentation: 'Tip: OSIA v1.2.0 defines standard APIs for interoperability between identity systems.',
  default: 'Tip: Start with the Generate tab to create your first UIN using foundational mode.'
};

export default function ChatWidget({ currentTab, currentLanguage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Map tab names to context
  const getContext = useCallback(() => {
    const tabContextMap = {
      0: 'generate',
      1: 'pool',
      2: 'lookup',
      3: 'security',
      4: 'documentation'
    };
    return tabContextMap[currentTab] || 'default';
  }, [currentTab]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Add welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const context = getContext();
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm Anna, your AI assistant for the OSIA UIN Generator. I can help you understand identity systems, UIN generation, security features, and more.\n\n${contextTips[context] || contextTips.default}\n\nHow can I help you today?`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length, getContext]);

  // Send message to AI
  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setShowSuggestions(false);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          sessionId: sessionId,
          context: getContext()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }]);

    } catch (err) {
      console.error('Chat error:', err);
      setError('Sorry, I encountered an error. Please try again.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  // Clear chat
  const handleClearChat = async () => {
    if (sessionId) {
      try {
        await fetch(`${API_BASE}/chat/session/${sessionId}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Failed to clear session:', err);
      }
    }
    setMessages([]);
    setSessionId(null);
    setShowSuggestions(true);
    setError(null);
  };

  // Toggle chat open/closed
  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Minimize chat
  const minimizeChat = () => {
    setIsMinimized(true);
  };

  // Close chat
  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  // Get current suggestions based on context
  const currentSuggestions = contextStarters[getContext()] || contextStarters.default;

  // Format message content with markdown-like styling
  const formatMessage = (content) => {
    // Split into paragraphs
    const paragraphs = content.split('\n\n');

    return paragraphs.map((para, idx) => {
      // Handle bullet points
      if (para.includes('\n- ') || para.startsWith('- ')) {
        const lines = para.split('\n');
        return (
          <div key={idx} className="message-paragraph">
            {lines.map((line, lineIdx) => {
              if (line.startsWith('- ')) {
                return <div key={lineIdx} className="message-bullet">• {line.substring(2)}</div>;
              }
              return <div key={lineIdx}>{line}</div>;
            })}
          </div>
        );
      }

      // Handle numbered lists
      if (/^\d+\./.test(para)) {
        const lines = para.split('\n');
        return (
          <div key={idx} className="message-paragraph message-list">
            {lines.map((line, lineIdx) => (
              <div key={lineIdx} className="message-list-item">{line}</div>
            ))}
          </div>
        );
      }

      // Regular paragraph
      return <p key={idx} className="message-paragraph">{para}</p>;
    });
  };

  return (
    <>
      {/* Chat Button */}
      <button
        className={`chat-button ${isOpen ? 'hidden' : ''}`}
        onClick={toggleChat}
        aria-label="Open chat assistant"
      >
        <img src="/anna-avatar.png" alt="Anna" className="chat-button-avatar" />
        <span className="chat-button-badge">AI</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`chat-window ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="chat-header" onClick={isMinimized ? toggleChat : undefined}>
            <div className="chat-header-info">
              <img src="/anna-avatar.png" alt="Anna" className="chat-header-avatar" />
              <div className="chat-header-text">
                <span className="chat-header-name">Anna</span>
                <span className="chat-header-status">AI Assistant</span>
              </div>
            </div>
            <div className="chat-header-actions">
              {!isMinimized && (
                <>
                  <button
                    className="chat-header-btn"
                    onClick={handleClearChat}
                    title="Clear chat"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                  <button
                    className="chat-header-btn"
                    onClick={minimizeChat}
                    title="Minimize"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14"/>
                    </svg>
                  </button>
                </>
              )}
              <button
                className="chat-header-btn"
                onClick={closeChat}
                title="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="chat-messages">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`chat-message ${msg.role} ${msg.isError ? 'error' : ''}`}
                  >
                    {msg.role === 'assistant' && (
                      <img src="/anna-avatar.png" alt="Anna" className="message-avatar" />
                    )}
                    <div className="message-content">
                      {formatMessage(msg.content)}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="chat-message assistant">
                    <img src="/anna-avatar.png" alt="Anna" className="message-avatar" />
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                {showSuggestions && messages.length > 0 && (
                  <div className="chat-suggestions">
                    <p className="suggestions-label">Try asking:</p>
                    {currentSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        className="suggestion-chip"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form className="chat-input-form" onSubmit={handleSubmit}>
                <input
                  ref={inputRef}
                  type="text"
                  className="chat-input"
                  placeholder="Ask Anna anything..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={isLoading || !inputValue.trim()}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              </form>

              {/* Footer */}
              <div className="chat-footer">
                <span>Powered by OSIA Knowledge Base</span>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
