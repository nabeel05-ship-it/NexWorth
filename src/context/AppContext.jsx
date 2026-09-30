import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { DEMO_EXPENSES, DEMO_GOALS, DEFAULT_USER } from '../utils/demoData';
import { fetchDbStatus, fetchExpensesFromDb, saveExpenseToDb, deleteExpenseFromDb, syncExpensesToDb } from '../utils/api';

const AppContext = createContext();

const initialState = {
  user: DEFAULT_USER,
  expenses: DEMO_EXPENSES,
  goals: DEMO_GOALS,
  currentPage: 'dashboard',
  isOnboarded: true,
  darkMode: true,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };

    case 'SET_EXPENSES':
      return {
        ...state,
        expenses: action.payload,
      };

    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [{ id: action.payload._id || action.payload.id || Date.now(), ...action.payload }, ...state.expenses],
      };

    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(e => ((e._id && e._id === action.payload._id) || e.id === action.payload.id ? action.payload : e)),
      };

    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(e => e._id !== action.payload && e.id !== action.payload),
      };

    case 'IMPORT_EXPENSES':
      return {
        ...state,
        expenses: [...action.payload, ...state.expenses],
      };

    case 'ADD_GOAL':
      return {
        ...state,
        goals: [...state.goals, { id: Date.now(), ...action.payload }],
      };

    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g => (g.id === action.payload.id ? action.payload : g)),
      };

    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(g => g.id !== action.payload),
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case 'UPDATE_BUDGETS':
      return {
        ...state,
        user: { ...state.user, budgets: { ...state.user.budgets, ...action.payload } },
      };

    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };

    case 'SET_ONBOARDED':
      return { ...state, isOnboarded: true };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [mongoStatus, setMongoStatus] = useState({
    connected: false,
    checking: true,
    cluster: 'Cluster0',
    database: 'nexworth',
    host: 'cluster0.2fmepzy.mongodb.net',
  });

  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    try {
      const saved = localStorage.getItem('nexworth_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initial, ...parsed };
      }
    } catch (e) {
      // Local storage fallback
    }
    return initial;
  });

  // Sync to localStorage
  useEffect(() => {
    const toSave = { ...state };
    localStorage.setItem('nexworth_state', JSON.stringify(toSave));
  }, [state]);

  // Connect & Sync with MongoDB on mount
  useEffect(() => {
    let isMounted = true;

    async function initMongo() {
      const status = await fetchDbStatus();
      if (!isMounted) return;

      if (status && status.connected) {
        setMongoStatus({
          connected: true,
          checking: false,
          cluster: status.cluster || 'Cluster0',
          database: status.database || 'nexworth',
          host: status.host,
          user: status.user,
        });

        // Fetch records from MongoDB
        const dbExpenses = await fetchExpensesFromDb();
        if (dbExpenses && Array.isArray(dbExpenses)) {
          if (dbExpenses.length === 0) {
            // Seed initial demo expenses to MongoDB
            const syncResult = await syncExpensesToDb(state.expenses);
            if (syncResult && syncResult.items && syncResult.items.length > 0) {
              dispatch({ type: 'SET_EXPENSES', payload: syncResult.items });
            }
          } else {
            // Use live MongoDB expenses
            dispatch({ type: 'SET_EXPENSES', payload: dbExpenses });
          }
        }
      } else {
        setMongoStatus(prev => ({ ...prev, connected: false, checking: false }));
      }
    }

    initMongo();
    return () => { isMounted = false; };
  }, []);

  // Enhanced dispatch that syncs to MongoDB asynchronously
  const enhancedDispatch = (action) => {
    dispatch(action);

    if (mongoStatus.connected) {
      if (action.type === 'ADD_EXPENSE') {
        saveExpenseToDb(action.payload).catch(console.error);
      } else if (action.type === 'DELETE_EXPENSE') {
        deleteExpenseFromDb(action.payload).catch(console.error);
      }
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch: enhancedDispatch, mongoStatus }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
