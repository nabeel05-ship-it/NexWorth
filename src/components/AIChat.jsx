import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { processAIChat } from '../utils/aiEngine';
import { MessageCircle, Send, Sparkles, Bot, User } from 'lucide-react';

const SUGGESTIONS = [
  'Where am I spending the most?',
  'Why did my expenses increase this month?',
  'What if I reduce shopping by ₹1,000?',
  'How much should I save monthly for my laptop?',
  'How much did I spend on food this month?',
  'What changed compared with last month?',
  'Show my budget status',
  'What are my goals?',
];

export default function AIChat() {
  const { state } = useApp();
  const { expenses, user, goals } = state;

  const [messages, setMessages] = useState([
    {
      type: 'ai',
      text: `Hello! I'm your NexWorth AI assistant. 👋\n\nI can help you understand your spending patterns, analyze expenses, and answer financial questions based on your data.\n\nTry asking me something like:\n• "Where am I spending the most?"\n• "What if I save ₹2,000 every month?"\n• "Show my budget status"`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (text) => {
    const query = text || input.trim();
    if (!query) return;

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: query }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const response = processAIChat(query, expenses, user.monthlyIncome, user.budgets, goals);
      setMessages(prev => [...prev, { type: 'ai', text: response }]);
      setIsTyping(false);
    }, 600 + Math.random() * 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-1">
          <h2>AI Financial Assistant</h2>
          <span className="ai-badge"><Sparkles size={12} /> AI Powered</span>
        </div>
        <p className="subtitle">Ask questions about your spending, budgets, and financial scenarios</p>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="chat-container" style={{ height: 'calc(100vh - 240px)', padding: '0 24px 24px' }}>
          {/* Suggestions */}
          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Suggested questions:</div>
            <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
              {SUGGESTIONS.slice(0, 4).map((s, i) => (
                <button key={i} className="btn btn-outline btn-sm" onClick={() => handleSend(s)} style={{ fontSize: 12 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.type}`}>
                <div className="chat-avatar">
                  {msg.type === 'ai' ? <Bot size={18} /> : <User size={18} />}
                </div>
                <div className="chat-bubble">{msg.text}</div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message ai">
                <div className="chat-avatar"><Bot size={18} /></div>
                <div className="chat-bubble" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="typing-dot" style={{ animationDelay: '0s' }}>●</span>
                  <span className="typing-dot" style={{ animationDelay: '0.2s' }}>●</span>
                  <span className="typing-dot" style={{ animationDelay: '0.4s' }}>●</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <input
              className="form-input"
              placeholder="Ask me about your spending, budgets, or financial scenarios..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
            />
            <button className="btn btn-primary btn-icon" onClick={() => handleSend()} disabled={isTyping || !input.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .typing-dot {
          font-size: 10px;
          color: var(--primary-light);
          animation: typingDot 1.2s infinite;
        }
        @keyframes typingDot {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
