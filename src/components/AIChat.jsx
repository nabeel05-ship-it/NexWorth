import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { processAIChat } from '../utils/aiEngine';
import { MessageCircle, Send, Sparkles, Bot, User, ArrowRight, Target } from 'lucide-react';

const SUGGESTIONS = [
  'What if I save ₹1,000 more every month?',
  'Where are my frequent small expenses?',
  'What happens if I reduce shopping by ₹500?',
  'How can I reach my current goal?',
  'What if I invest ₹2,000 per month?',
];

export default function AIChat() {
  const { state } = useApp();
  const { expenses, user, goals } = state;

  const [messages, setMessages] = useState([
    {
      type: 'ai',
      text: `Hello! I'm your NexWorth AI assistant. 👋\n\nI can help you understand your spending patterns, analyze expenses, and explore financial what-if scenarios based on your actual data.\n\nTry asking me something like:\n• "What if I reduce food spending by ₹500 per month?"\n• "What happens if I save ₹2,000 every month?"\n• "Where are my frequent small expenses?"`,
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

    // Simulate AI thinking & processing
    setTimeout(() => {
      const response = processAIChat(query, expenses, user.monthlyIncome, user.budgets, goals);
      setMessages(prev => [...prev, { type: 'ai', ...response }]);
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
          <h2>Ask Your Money</h2>
          <span className="ai-badge"><Sparkles size={12} /> AI Powered</span>
        </div>
        <p className="subtitle">Explore your spending, goals and financial what-if scenarios.</p>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="chat-container" style={{ height: 'calc(100vh - 240px)', padding: '0 24px 24px' }}>
          {/* Suggestions (only show if no user messages yet) */}
          {messages.length <= 1 && (
            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Suggested questions:</div>
              <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="btn btn-outline btn-sm" onClick={() => handleSend(s)} style={{ fontSize: 12 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.type}`} style={{ display: 'flex', gap: 12, flexDirection: msg.type === 'user' ? 'row-reverse' : 'row' }}>
                <div className="chat-avatar" style={{ 
                  background: msg.type === 'ai' ? 'rgba(252, 108, 38, 0.1)' : 'var(--bg-secondary)',
                  color: msg.type === 'ai' ? 'var(--primary)' : 'var(--text)',
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {msg.type === 'ai' ? <Bot size={18} /> : <User size={18} />}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: '85%' }}>
                  <div className="chat-bubble" style={{
                    background: msg.type === 'ai' ? '#FFFFFF' : 'var(--primary)',
                    color: msg.type === 'ai' ? 'var(--text)' : '#FFFFFF',
                    padding: '12px 16px', borderRadius: 12, border: msg.type === 'ai' ? '1px solid var(--border)' : 'none',
                    borderTopLeftRadius: msg.type === 'ai' ? 0 : 12,
                    borderTopRightRadius: msg.type === 'user' ? 0 : 12,
                    whiteSpace: 'pre-wrap', lineHeight: 1.5, fontSize: 14
                  }}>
                    {msg.text}
                  </div>
                  
                  {/* Structured Scenario Card */}
                  {msg.scenario && (
                    <div style={{ 
                      background: '#FFFFFF', border: '1px solid var(--primary-light)', borderRadius: 12, 
                      padding: 16, boxShadow: '0 4px 12px rgba(252, 108, 38, 0.05)'
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 0.5, marginBottom: 12 }}>
                        WHAT-IF SCENARIO
                      </div>
                      
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Change:</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{msg.scenario.changeDesc}</div>
                      </div>
                      
                      <div className="grid-2" style={{ gap: 12, marginBottom: 16 }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Monthly Difference:</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary)' }}>₹{msg.scenario.monthly.toLocaleString('en-IN')}</div>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>6 Months:</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary)' }}>₹{(msg.scenario.monthly * 6).toLocaleString('en-IN')}</div>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>12 Months:</div>
                          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary)' }}>₹{(msg.scenario.monthly * 12).toLocaleString('en-IN')}</div>
                        </div>
                        {msg.scenario.investedValue && (
                          <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: 12, borderRadius: 8 }}>
                            <div style={{ fontSize: 11, color: '#16A34A' }}>Estimated 1yr Value (12% return):</div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: '#16A34A' }}>₹{msg.scenario.investedValue.toLocaleString('en-IN')}</div>
                          </div>
                        )}
                      </div>
                      
                      {msg.scenario.goalImpact && (
                        <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 12, marginBottom: 16 }}>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Goal Impact:</div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--success)' }}>+₹{(msg.scenario.monthly * 12).toLocaleString('en-IN')} potential contribution</div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {msg.scenario.goalImpact && (
                          <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => handleSend('Apply to my goal')}>
                            <Target size={14} /> Apply to Goal
                          </button>
                        )}
                        <button className="btn btn-outline btn-sm flex items-center gap-1" onClick={() => setInput('What if I ')}>
                          Try Another Scenario <ArrowRight size={14} />
                        </button>
                      </div>
                      {msg.scenario.investedValue && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 12 }}>
                          * Illustrative estimate — actual returns may vary.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Follow-up suggestions */}
                  {msg.followUps && msg.followUps.length > 0 && (
                    <div className="flex gap-2" style={{ flexWrap: 'wrap', marginTop: 8 }}>
                      {msg.followUps.map((f, idx) => (
                        <button key={idx} className="btn btn-outline btn-sm" onClick={() => handleSend(f)} style={{ fontSize: 12, background: '#FFFFFF' }}>
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message ai" style={{ display: 'flex', gap: 12 }}>
                <div className="chat-avatar" style={{ background: 'rgba(252, 108, 38, 0.1)', color: 'var(--primary)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={18} />
                </div>
                <div className="chat-bubble" style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: 12, borderTopLeftRadius: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className="typing-dot" style={{ animationDelay: '0s' }}>●</span>
                  <span className="typing-dot" style={{ animationDelay: '0.2s' }}>●</span>
                  <span className="typing-dot" style={{ animationDelay: '0.4s' }}>●</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area" style={{ marginTop: 24 }}>
            <input
              className="form-input"
              placeholder="Ask me about your spending, goals, or what-if scenarios..."
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
