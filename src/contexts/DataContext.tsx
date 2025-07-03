import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Income, Expense, Budget, SavingsGoal, BankAccount
} from '../types';
import { useAuth } from './AuthContext';
import {
  getIncomes, saveIncome as saveIncomeToStorage, deleteIncome as deleteIncomeFromStorage,
  getBudgets, saveBudget as saveBudgetToStorage, deleteBudget as deleteBudgetFromStorage,
  getSavingsGoals, saveSavingsGoal as saveSavingsGoalToStorage, deleteSavingsGoal as deleteSavingsGoalFromStorage,
  getBankAccounts, saveBankAccount as saveBankAccountToStorage, deleteBankAccount as deleteBankAccountFromStorage,
  updateBankAccountBalance, generateId
} from '../utils/storage';
import { calculateBudgetProgress } from '../utils/calculations';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface DataContextType {
  bankAccounts: BankAccount[];
  selectedBankAccount: BankAccount | null;
  addBankAccount: (account: Omit<BankAccount, 'id' | 'userId' | 'createdAt' | 'totalIncome' | 'totalExpense'>) => Promise<void>;
  updateBankAccount: (account: BankAccount) => Promise<void>;
  deleteBankAccount: (accountId: string) => Promise<void>;
  setSelectedBankAccount: (account: BankAccount | null) => void;

  incomes: Income[];
  expenses: Expense[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];

  addIncome: (income: Omit<Income, 'id' | 'userId'>) => Promise<void>;
  updateIncome: (income: Income) => Promise<void>;
  deleteIncome: (incomeId: string) => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id' | 'userId'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;

  addBudget: (budget: Omit<Budget, 'id' | 'userId'>) => void;
  updateBudget: (budget: Budget) => void;

  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'userId'>) => void;
  updateSavingsGoal: (goal: SavingsGoal) => void;
  deleteSavingsGoal: (goalId: string) => void;

  refreshData: () => Promise<void>;

  budgetProgress: Record<string, number>; // ADDED

  deleteBudget: (budgetId: string) => void;
  
  // Auto-tracking utilities
  updateAutoTrackedSavingsForAccount: (bankAccountId: string, totalIncome: number, totalExpense: number) => void;
  updateAllAutoTrackedSavings: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Custom hook for auto-tracking savings goals
export const useAutoTrackSavingsGoal = () => {
  const { selectedBankAccount, updateAutoTrackedSavingsForAccount, updateAllAutoTrackedSavings } = useData();
  
  const getCurrentMonthlySavings = () => {
    if (!selectedBankAccount) return 0;
    return Math.max(0, selectedBankAccount.totalIncome - selectedBankAccount.totalExpense);
  };
  
  const updateSavingsForAccount = (bankAccountId: string) => {
    if (!selectedBankAccount) return;
    const monthlySavings = getCurrentMonthlySavings();
    updateAutoTrackedSavingsForAccount(bankAccountId, selectedBankAccount.totalIncome, selectedBankAccount.totalExpense);
  };
  
  return {
    currentMonthlySavings: getCurrentMonthlySavings(),
    updateSavingsForAccount,
    updateAllSavings: updateAllAutoTrackedSavings,
    hasSelectedAccount: !!selectedBankAccount
  };
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [budgetProgress, setBudgetProgress] = useState<Record<string, number>>({}); // ADDED
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [monthlySavings, setMonthlySavings] = useState(0);

  const refreshData = async () => {
    if (user) {
      try {
        const accounts = await getBankAccounts(user.uid);
        setBankAccounts(accounts);

        if (accounts.length > 0 && !selectedBankAccount) {
          setSelectedBankAccount(accounts[0]);
        }

        const currentAccountId = selectedBankAccount?.id;
        setIncomes(getIncomes(user.uid, currentAccountId));
        // setExpenses(getExpenses(user.uid, currentAccountId));
        setBudgets(getBudgets(user.uid, currentAccountId));
        
        // Load goals and clean up duplicates
        const goals = getSavingsGoals(user.uid, currentAccountId);
        const deduplicatedGoals = removeDuplicateGoals(goals);
        setSavingsGoals(deduplicatedGoals);
      } catch (error) {
        console.error('Error loading bank accounts:', error);
      }
    }
  };

  const updateAllBudgetProgress = (
    budgetsList: Budget[],
    expensesList: Expense[],
    date = new Date()
  ) => {
    const progress: Record<string, number> = {};
    budgetsList.forEach(budget => {
      progress[budget.id] = calculateBudgetProgress(expensesList, budget, date);
    });
    setBudgetProgress(progress);
  };

  useEffect(() => {
    refreshData();
  }, [user]); // Only refresh when user changes, not when selectedBankAccount changes

  useEffect(() => {
    updateAllBudgetProgress(budgets, expenses);
  }, [budgets, expenses]); // Auto update

  // Update auto-tracked savings when selected bank account changes
  useEffect(() => {
    if (selectedBankAccount) {
      // Load data for the selected account
      if (user) {
        const currentAccountId = selectedBankAccount.id;
        setIncomes(getIncomes(user.uid, currentAccountId));
        // setExpenses(getExpenses(user.uid, currentAccountId));
        setBudgets(getBudgets(user.uid, currentAccountId));
        
        // Load goals and clean up duplicates
        const goals = getSavingsGoals(user.uid, currentAccountId);
        const deduplicatedGoals = removeDuplicateGoals(goals);
        setSavingsGoals(deduplicatedGoals);
      }
      // Update auto-tracked savings
      updateAllAutoTrackedSavings();
    }
  }, [selectedBankAccount]); // Handle bank account changes separately

  useEffect(() => {
    if (!user || !selectedBankAccount) return;
    setLoading(true);
    // Expenses listener
    const expensesRef = collection(db, 'users', user.uid, 'bankAccounts', selectedBankAccount.id, 'expenses');
    const unsubscribeExpenses = onSnapshot(expensesRef, (snapshot) => {
      const expenseList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[];
      setExpenses(expenseList);
      const total = expenseList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      setTotalExpense(total);
      setLoading(false);
    });
    // Incomes listener
    const incomesRef = collection(db, 'users', user.uid, 'bankAccounts', selectedBankAccount.id, 'incomes');
    const unsubscribeIncomes = onSnapshot(incomesRef, (snapshot) => {
      const incomeList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Income[];
      setIncomes(incomeList);
      const total = incomeList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      setTotalIncome(total);
      setLoading(false);
    });
    return () => {
      unsubscribeExpenses();
      unsubscribeIncomes();
    };
  }, [user, selectedBankAccount]);

  // Monthly savings calculation
  useEffect(() => {
    setMonthlySavings(totalIncome - totalExpense);
  }, [totalIncome, totalExpense]);

  // Bank Account operations
  const addBankAccount = async (accountData: Omit<BankAccount, 'id' | 'userId' | 'createdAt' | 'totalIncome' | 'totalExpense'>) => {
    if (!user) return;
    const account = {
      ...accountData,
      id: generateId(),
      userId: user.uid,
      bankId: accountData.bankName, // Use bankName as bankId for now
      totalIncome: accountData.startingBalance,
      totalExpense: 0,
      createdAt: new Date().toISOString(),
      startingBalance: accountData.startingBalance,
      currentBalance: accountData.startingBalance
    };
    await saveBankAccountToStorage(account);
    setBankAccounts(prev => [...prev, account]);
    // Always select the newly created account
    setSelectedBankAccount(account);
    // Create initial income transaction for starting balance
    if (accountData.startingBalance > 0) {
      const initialIncome: Omit<Income, 'id' | 'userId'> = {
        bankAccountId: account.id,
        source: 'Initial Balance',
        amount: accountData.startingBalance,
        frequency: 'one-time',
        date: new Date().toISOString(),
        description: 'Initial balance at account creation'
      };
      await addIncome(initialIncome);
    }
  };

  const updateBankAccount = async (account: BankAccount) => {
    await saveBankAccountToStorage(account);
    setBankAccounts(prev => prev.map(a => a.id === account.id ? account : a));
    if (selectedBankAccount?.id === account.id) {
      setSelectedBankAccount(account);
    }
  };

  const deleteBankAccount = async (accountId: string) => {
    if (!user) return;
    await deleteBankAccountFromStorage(accountId, user.uid);
    setBankAccounts(prev => prev.filter(a => a.id !== accountId));
    if (selectedBankAccount?.id === accountId) {
      const remaining = bankAccounts.filter(a => a.id !== accountId);
      setSelectedBankAccount(remaining.length > 0 ? remaining[0] : null);
    }
  };

  // Utility: Always recalculate totalIncome and currentBalance for a bank account using a provided incomes and expenses array
  const recalculateAndUpdateTotalsWithArray = async (bankAccountId: string, incomesArray: Income[], expensesArray: Expense[]) => {
    const accountIncomes = incomesArray.filter(i => i.bankAccountId === bankAccountId);
    const accountExpenses = expensesArray.filter(e => e.bankAccountId === bankAccountId);
    const totalIncome = accountIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = accountExpenses.reduce((sum, e) => sum + e.amount, 0);
    const currentBalance = totalIncome - totalExpense;
    const account = bankAccounts.find(a => a.id === bankAccountId);
    if (account) {
      const updatedAccount = {
        ...account,
        totalIncome,
        totalExpense,
        currentBalance
      };
      await updateBankAccount(updatedAccount);
      
      // Update auto-tracked savings for all goals associated with this bank account
      updateAutoTrackedSavingsForAccount(bankAccountId, totalIncome, totalExpense);
    }
  };

  // Utility: Update auto-tracked savings for all savings goals associated with a bank account
  const updateAutoTrackedSavingsForAccount = (bankAccountId: string, totalIncome: number, totalExpense: number) => {
    const monthlySavings = totalIncome - totalExpense;
    const updatedGoals = savingsGoals.map(goal => {
      // Update goals that are either global (no bankAccountId) or specific to this account
      if (!goal.bankAccountId || goal.bankAccountId === bankAccountId) {
        return {
          ...goal,
          autoTrackedAmount: Math.max(0, monthlySavings)
        };
      }
      return goal;
    });
    
    // Save updated goals to storage and update state
    updatedGoals.forEach(goal => {
      if (goal.autoTrackedAmount !== undefined) {
        saveSavingsGoalToStorage(goal);
      }
    });
    setSavingsGoals(updatedGoals);
  };

  // Utility: Update auto-tracked savings for all goals when bank account changes
  const updateAllAutoTrackedSavings = () => {
    if (selectedBankAccount) {
      const monthlySavings = selectedBankAccount.totalIncome - selectedBankAccount.totalExpense;
      const updatedGoals = savingsGoals.map(goal => ({
        ...goal,
        autoTrackedAmount: Math.max(0, monthlySavings)
      }));
      
      // Save updated goals to storage and update state
      updatedGoals.forEach(goal => {
        saveSavingsGoalToStorage(goal);
      });
      setSavingsGoals(updatedGoals);
    }
  };

  // Income operations
  const addIncome = async (incomeData: Omit<Income, 'id' | 'userId'>) => {
    if (!user) return;
    const income = {
      ...incomeData,
      id: generateId(),
      userId: user.uid
    };
    saveIncomeToStorage(income);
    setIncomes(prev => {
      const updated = [...prev, income];
      recalculateAndUpdateTotalsWithArray(income.bankAccountId, updated, expenses);
      return updated;
    });
  };

  const updateIncome = async (income: Income) => {
    const oldIncome = incomes.find(i => i.id === income.id);
    saveIncomeToStorage(income);
    setIncomes(prev => {
      const updated = prev.map(i => i.id === income.id ? income : i);
      recalculateAndUpdateTotalsWithArray(income.bankAccountId, updated, expenses);
      return updated;
    });
  };

  const deleteIncome = async (incomeId: string) => {
    const income = incomes.find(i => i.id === incomeId);
    if (!income) return;
    deleteIncomeFromStorage(incomeId);
    setIncomes(prev => {
      const updated = prev.filter(i => i.id !== incomeId);
      recalculateAndUpdateTotalsWithArray(income.bankAccountId, updated, expenses);
      return updated;
    });
  };

  // Expense operations
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'userId'>) => {
    if (!user) return;
    const expense = {
      ...expenseData,
      id: generateId(),
      userId: user.uid
    };
    // saveExpenseToStorage(expense); // Now handled by Firestore
    setExpenses(prev => {
      const updated = [...prev, expense];
      recalculateAndUpdateTotalsWithArray(expense.bankAccountId, incomes, updated);
      return updated;
    });
  };

  const updateExpense = async (expense: Expense) => {
    const oldExpense = expenses.find(e => e.id === expense.id);
    // saveExpenseToStorage(expense); // Now handled by Firestore
    setExpenses(prev => {
      const updated = prev.map(e => e.id === expense.id ? expense : e);
      recalculateAndUpdateTotalsWithArray(expense.bankAccountId, incomes, updated);
      return updated;
    });
  };

  const deleteExpense = async (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    // deleteExpenseFromStorage(expenseId); // Now handled by Firestore
    setExpenses(prev => {
      const updated = prev.filter(e => e.id !== expenseId);
      if (expense) {
        recalculateAndUpdateTotalsWithArray(expense.bankAccountId, incomes, updated);
      }
      return updated;
    });
  };

  // Budget operations
  const addBudget = (budgetData: Omit<Budget, 'id' | 'userId'>) => {
    if (!user) return;
    const budget = {
      ...budgetData,
      id: generateId(),
      userId: user.uid
    };
    saveBudgetToStorage(budget);
    setBudgets(prev => [...prev, budget]);
  };

  const updateBudget = (budget: Budget) => {
    saveBudgetToStorage(budget);
    setBudgets(prev => prev.map(b => b.id === budget.id ? budget : b));
  };

  // Savings Goal operations
  const addSavingsGoal = (goalData: Omit<SavingsGoal, 'id' | 'userId'>) => {
    if (!user) return;
    
    // Check if a goal with the same title already exists
    const existingGoal = savingsGoals.find(goal => 
      goal.title.toLowerCase() === goalData.title.toLowerCase() &&
      goal.userId === user.uid
    );
    
    if (existingGoal) {
      console.warn('A goal with this title already exists:', goalData.title);
      return; // Don't create duplicate
    }
    
    // Calculate current monthly savings for auto-tracking
    const monthlySavings = selectedBankAccount ? 
      selectedBankAccount.totalIncome - selectedBankAccount.totalExpense : 0;
    
    const goal = {
      ...goalData,
      id: generateId(),
      userId: user.uid,
      autoTrackedAmount: Math.max(0, monthlySavings) // Initialize with current monthly savings
    };
    saveSavingsGoalToStorage(goal);
    setSavingsGoals(prev => [...prev, goal]);
  };

  const updateSavingsGoal = (goal: SavingsGoal) => {
    saveSavingsGoalToStorage(goal);
    setSavingsGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
  };

  const deleteSavingsGoal = (goalId: string) => {
    if (!user) return;
    deleteSavingsGoalFromStorage(goalId, user.uid);
    setSavingsGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const deleteBudget = (budgetId: string) => {
    deleteBudgetFromStorage(budgetId);
    setBudgets(prev => prev.filter(b => b.id !== budgetId));
  };

  // Utility: Remove duplicate goals based on title and userId
  const removeDuplicateGoals = (goals: SavingsGoal[]): SavingsGoal[] => {
    const seen = new Set<string>();
    const uniqueGoals: SavingsGoal[] = [];
    
    goals.forEach(goal => {
      const key = `${goal.userId}-${goal.title.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueGoals.push(goal);
      } else {
        console.warn('Removing duplicate goal:', goal.title);
        // Remove from storage using proper function with userId
        if (user) {
          deleteSavingsGoalFromStorage(goal.id, user.uid);
        }
      }
    });
    
    return uniqueGoals;
  };

  const value = {
    bankAccounts,
    selectedBankAccount,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    setSelectedBankAccount,
    incomes,
    expenses,
    budgets,
    savingsGoals,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    addBudget,
    updateBudget,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    refreshData,
    budgetProgress,
    deleteBudget,
    updateAutoTrackedSavingsForAccount,
    updateAllAutoTrackedSavings
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
