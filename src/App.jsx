import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { pageVariants, pageVariantsReduced } from './utils/motionVariants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import AITransactionCapture from './components/AITransactionCapture';
import AIInsights from './components/AIInsights';
import WhatIfSimulator from './components/WhatIfSimulator';
import GoalPlanner from './components/GoalPlanner';
import SpendSaveInvest from './components/SpendSaveInvest';
import FutureValueCalc from './components/FutureValueCalc';
import SpendingForecast from './components/SpendingForecast';
import AIChat from './components/AIChat';
import Privacy from './components/Privacy';

function AppContent() {
  const { state } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const renderPage = () => {
    switch (state.currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'capture': return <AITransactionCapture />;
      case 'import': return <AITransactionCapture />;
      case 'add-expense': return <ExpenseForm />;
      case 'insights': return <AIInsights />;
      case 'what-if': return <WhatIfSimulator />;
      case 'goals': return <GoalPlanner />;
      case 'compare': return <SpendSaveInvest />;
      case 'calculator': return <FutureValueCalc />;
      case 'forecast': return <SpendingForecast />;
      case 'ai-chat': return <AIChat />;
      case 'privacy': return <Privacy />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen(prev => !prev)}
      />
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentPage}
            variants={shouldReduceMotion ? pageVariantsReduced : pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ width: '100%' }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
