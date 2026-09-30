import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { DEMO_EXPENSES, DEMO_GOALS, DEFAULT_USER } from '../utils/demoData';

const AppContext = createContext();

const initialState = {
  user: DEFAULT_USER,
  expenses: DEMO_EXPENSES,
  goals: DEMO_GOALS,
  currentPage: 'dashboard',
  isOnboarded: true, // Start with demo data loaded
  darkMode: true,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };

    case 'ADD_EXPENSE':
      return {
        ...state,
        expenses: [{ id: Date.now(), ...action.payload }, ...state.expenses],
      };

    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(e => (e.id === action.payload.id ? action.payload : e)),
      };

    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(e => e.id !== action.payload),
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
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    try {
      const saved = localStorage.getItem('nexworth_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initial, ...parsed };
      }
    } catch (e) {
      // Use initial state if localStorage is corrupted
    }
    return initial;
  });

  useEffect(() => {
    const toSave = { ...state };
    localStorage.setItem('nexworth_state', JSON.stringify(toSave));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
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
