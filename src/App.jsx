import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import CSVImport from './components/CSVImport';
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

  const renderPage = () => {
    switch (state.currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'add-expense': return <ExpenseForm />;
      case 'import': return <CSVImport />;
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
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(!sidebarOpen)} />
      <main className="main-content">
        {renderPage()}
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
