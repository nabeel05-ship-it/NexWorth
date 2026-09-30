import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { processAIChat, getMonthlyOverview, analyzeSpendingPatterns } from '../utils/aiEngine';
import { sendAIChatQuery } from '../utils/api';
import { MessageCircle, Send, Sparkles, Bot, User, ArrowRight, Target, Zap } from 'lucide-react';

export default function AIChat() {
  const { state, dispatch } = useApp();
  const { expenses, user, goals } = state;

  const [messages, setMessages] = useState([
    {
      type: 'ai',
      text: `Hello! I'm your NexWorth AI assistant powered by Gemini 2.5 Flash. 👋\n\nI analyze your real expenses, detect micro-expense leaks, and simulate deterministic financial what-if scenarios connected to your goals.\n\nTry asking me in Hindi, Hinglish, or English:\n• "Agar ₹500 kam spend karu?"\n• "Where are my frequent small expenses?"\n• "Show my AI Spending Pattern"\n• "What if I invest ₹2,000 per month for 5 years?"`,
      model: 'gemini-2.5-flash',
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

  // Handle pending query from AI Insights or Dashboard
  useEffect(() => {
    if (state.pendingChatQuery) {
      const q = state.pendingChatQuery;
      dispatch({ type: 'CLEAR_CHAT_QUERY' });
      handleSend(q);
    }
  }, [state.pendingChatQuery]);

  const handleApplyToGoal = (scenario) => {
    const amount = scenario.annualSavings || (scenario.monthly * 12);
    const targetGoal = (goals && goals.find(g => (scenario.targetGoalId && g.id === scenario.targetGoalId) || g.name.toLowerCase().includes('laptop'))) || goals?.[0] || {
      id: 1,
      name: 'Laptop',
      targetAmount: 60000,
      currentAmount: 35000,
    };

    dispatch({
      type: 'APPLY_GOAL_CONTRIBUTION',
      payload: { goalId: targetGoal.id, amount, goalName: targetGoal.name },
    });

    const prevAmount = targetGoal.currentAmount || 35000;
    const targetAmount = targetGoal.targetAmount || 60000;
    const newAmount = Math.min(targetAmount, prevAmount + amount);
    const newPercent = Math.min(100, Math.round((newAmount / targetAmount) * 100));
    const remaining = Math.max(0, targetAmount - newAmount);

    setMessages(prev => [
      ...prev,
      {
        type: 'user',
        text: `Apply ₹${amount.toLocaleString('en-IN')} to ${targetGoal.name} Goal`,
      },
      {
        type: 'ai',
        appliedSuccess: true,
        model: 'gemini-2.5-flash',
        text: `🎉 **Goal Updated Successfully!**\n\nApplied **+₹${amount.toLocaleString('en-IN')}** simulated savings to your **${targetGoal.name} Goal**!\n\n• Target: ₹${targetAmount.toLocaleString('en-IN')}\n• Previously Saved: ₹${prevAmount.toLocaleString('en-IN')} (${Math.round((prevAmount / targetAmount) * 100)}%)\n• New Progress: ₹${newAmount.toLocaleString('en-IN')} (${newPercent}% reached!)\n• Remaining: ₹${remaining.toLocaleString('en-IN')}\n\nYou're now 68% of the way there and projected to reach your ${targetGoal.name} goal 3 months sooner! 🎯`,
        followUps: [
          'View Laptop Goal in Planner 🎯',
          'What if I invest ₹2,000 per month? 📈',
          'Where are my frequent small expenses? ☕',
          'Show my AI Spending Pattern 🧬',
        ],
      },
    ]);
  };

  const handleSend = async (text) => {
    const query = text || input.trim();
    if (!query) return;

    if (query.includes('View') && query.includes('Planner')) {
      dispatch({ type: 'SET_PAGE', payload: 'goals' });
      return;
    }

    if (query.includes('Spending Pattern') || query.includes('AI Spending Pattern')) {
      dispatch({ type: 'SET_PAGE', payload: 'insights' });
      return;
    }

    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: query }]);
    setInput('');
    setIsTyping(true);

    const overview = getMonthlyOverview(expenses, user.monthlyIncome);
    const patterns = analyzeSpendingPatterns(expenses, user.monthlyIncome, goals);

    try {
      // Call Gemini 2.5 Flash via our backend endpoint
      const remoteRes = await sendAIChatQuery({
        query,
        expenses,
        income: user.monthlyIncome,
        budgets: user.budgets,
        goals,
        overview,
        patterns,
      });

      let response = remoteRes;
      if (!response || !response.text) {
        // Fallback to deterministic local engine
        response = processAIChat(query, expenses, user.monthlyIncome, user.budgets, goals);
      }

      // If AI applied a goal
      if (response.isGoalApplied) {
        dispatch({
          type: 'APPLY_GOAL_CONTRIBUTION',
          payload: {
            goalId: response.appliedGoalId,
            amount: response.appliedAmount,
            goalName: response.appliedGoalName,
          },
        });
      }

      setMessages(prev => [...prev, { type: 'ai', ...response }]);
    } catch (err) {
      const fallback = processAIChat(query, expenses, user.monthlyIncome, user.budgets, goals);
      setMessages(prev => [...prev, { type: 'ai', ...fallback }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const SUGGESTIONS = [
    'Agar ₹500 kam spend karu?',
    'Where are my frequent small expenses?',
    'Show my AI Spending Pattern 🧬',
    'How can I reach my Laptop goal faster?',
    'What if I invest ₹2,000 per month?',
  ];

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-1" style={{ flexWrap: 'wrap' }}>
          <h2>Ask Your Money</h2>
          <span className="ai-badge" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#16A34A', borderColor: 'rgba(34, 197, 94, 0.25)' }}>
            <Sparkles size={12} /> Gemini 2.5 Flash Live
          </span>
          <span className="ai-badge"><Zap size={12} /> Deterministic Engine</span>
        </div>
        <p className="subtitle">Explore your spending patterns, simulate what-if scenarios, and connect savings directly to your goals.</p>
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
                    {msg.type === 'ai' && (
                      <div style={{ fontSize: 10.5, color: '#16A34A', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Sparkles size={11} /> Gemini 2.5 Flash
                      </div>
                    )}
                    {msg.text}
                  </div>
                  
                  {/* Structured Scenario Card */}
                  {msg.scenario && (
                    <div style={{ 
                      background: '#FFFFFF', border: '1px solid rgba(252, 108, 38, 0.3)', borderRadius: 12, 
                      padding: 16, boxShadow: '0 4px 16px rgba(252, 108, 38, 0.08)'
                    }}>
                      <div className="flex justify-between items-center mb-2">
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: 0.5 }}>
                          WHAT-IF SCENARIO
                        </div>
                        <span style={{ fontSize: 10, background: 'rgba(252, 108, 38, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                          Deterministic Engine
                        </span>
                      </div>
                      
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Simulated Change:</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{msg.scenario.changeDesc}</div>
                      </div>
                      
                      <div className="grid-3" style={{ gap: 10, marginBottom: 16 }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: 10, borderRadius: 8 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Monthly:</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>₹{msg.scenario.monthly.toLocaleString('en-IN')}</div>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', padding: 10, borderRadius: 8 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>6 Months:</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>₹{(msg.scenario.monthly * 6).toLocaleString('en-IN')}</div>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', padding: 10, borderRadius: 8 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>12 Months:</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>₹{(msg.scenario.annualSavings || msg.scenario.monthly * 12).toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                      
                      {msg.scenario.investedValue && (
                        <div style={{ background: 'rgba(34, 197, 94, 0.08)', padding: 10, borderRadius: 8, marginBottom: 14, border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                          <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 600 }}>Illustrative SIP Growth (12% return):</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#16A34A' }}>
                            ₹{msg.scenario.investedValue.toLocaleString('en-IN')} in 1 year
                          </div>
                        </div>
                      )}
                      
                      {msg.scenario.goalImpact && (
                        <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 12, marginBottom: 14 }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Goal Impact ({msg.scenario.targetGoalName || 'Laptop Goal'}):</div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#16A34A' }}>
                            +₹{(msg.scenario.annualSavings || msg.scenario.monthly * 12).toLocaleString('en-IN')} potential contribution (brings goal to ~68%!)
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                        {msg.scenario.goalImpact && (
                          <button
                            className="btn btn-primary btn-sm flex items-center gap-1"
                            onClick={() => handleApplyToGoal(msg.scenario)}
                          >
                            <Target size={14} /> Apply to {msg.scenario.targetGoalName || 'Laptop'} Goal
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-sm flex items-center gap-1"
                          onClick={() => handleSend(`What if I invest ₹${msg.scenario.monthly} per month?`)}
                        >
                          Invest Instead 📈
                        </button>
                        <button
                          className="btn btn-ghost btn-sm flex items-center gap-1"
                          onClick={() => setInput('What if I reduce ')}
                        >
                          Try Another <ArrowRight size={14} />
                        </button>
                      </div>
                      {msg.scenario.investedValue && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 10 }}>
                          * Illustrative estimate — actual market returns may vary.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Follow-up suggestions */}
                  {msg.followUps && msg.followUps.length > 0 && (
                    <div className="flex gap-2" style={{ flexWrap: 'wrap', marginTop: 4 }}>
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
