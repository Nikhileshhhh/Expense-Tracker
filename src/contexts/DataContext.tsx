import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Income, Expense, Budget, SavingsGoal, BankAccount
} from '../types';
import { useAuth } from './AuthContext';
import {
  getIncomes, saveIncome as saveIncomeToStorage, deleteIncome as deleteIncomeFromStorage,
  getBankAccounts, saveBankAccount as saveBankAccountToStorage, deleteBankAccount as deleteBankAccountFromStorage,
  updateBankAccountBalance, generateId
} from '../utils/storage';
import { calculateBudgetProgress } from '../utils/calculations';
import { collection, onSnapshot, updateDoc, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { format, isSameMonth, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

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

  addBudget: (budget: Omit<Budget, 'id' | 'userId'>) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;

  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'userId'>) => Promise<void>;
  updateSavingsGoal: (goal: SavingsGoal) => Promise<void>;
  deleteSavingsGoal: (goalId: string) => Promise<void>;

  refreshData: () => Promise<void>;

  budgetProgress: Record<string, number>; // ADDED

  deleteBudget: (budgetId: string) => Promise<void>;
  
  // Auto-tracking utilities
  updateAutoTrackedSavingsForAccount: (bankAccountId: string, totalIncome: number, totalExpense: number) => Promise<void>;
  updateAllAutoTrackedSavings: () => Promise<void>;
  
  // Budget notification utilities
  getBudgetNotifications: () => { overBudget: Array<{ budget: Budget; bankAccount: BankAccount; progress: number }>; alertBudgets: Array<{ budget: Budget; bankAccount: BankAccount; progress: number }> };
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
    // Use current balance for auto-tracking (includes starting balance + income - expenses)
    return Math.max(0, selectedBankAccount.currentBalance);
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
  const [budgetProgress, setBudgetProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    if (user) {
      try {
        console.log('🔄 Refreshing data for user:', user.uid);
        const accounts = await getBankAccounts(user.uid);
        console.log('🔄 Found bank accounts:', accounts.length);
        console.log('🔄 Bank accounts:', accounts.map(a => ({ id: a.id, name: a.nickname || a.bankName, startingBalance: a.startingBalance })));
        
        setBankAccounts(accounts);

        if (accounts.length > 0 && !selectedBankAccount) {
          console.log('🔄 Setting first account as selected:', accounts[0].id);
          setSelectedBankAccount(accounts[0]);
        } else if (accounts.length === 0) {
          console.log('🔄 No bank accounts found, clearing selected account');
          setSelectedBankAccount(null);
        }

        // Budgets and savings goals are now handled by real-time listeners
        // No need to manually load them here
        
        console.log('🔄 Data refresh completed');
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
      // Calculate progress for all budgets across all bank accounts
      if (budget.bankAccountId) {
        progress[budget.id] = calculateBudgetProgress(expensesList, budget, date, budget.bankAccountId);
      }
    });
    setBudgetProgress(progress);
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  useEffect(() => {
    updateAllBudgetProgress(budgets, expenses);
  }, [budgets, expenses]);

  // Separate useEffect for selected bank account changes
  useEffect(() => {
    if (selectedBankAccount && user) {
        console.log('🔄 Selected bank account changed to:', selectedBankAccount.id);
        
        // Budgets and savings goals are now handled by real-time listeners
        // No need to manually load them here
      
      updateAllAutoTrackedSavings();
    }
  }, [selectedBankAccount]);

  // Real-time listener for selected bank account document
  useEffect(() => {
    if (!user || !selectedBankAccount) return;
    
    const accountRef = doc(db, 'users', user.uid, 'bankAccounts', selectedBankAccount.id);
    const unsubscribe = onSnapshot(accountRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSelectedBankAccount((prev) => {
          if (!prev) return null;
          const updatedAccount = { ...prev, ...data };
          
          // Trigger goal updates when account totals change
          if (data.totalIncome !== prev.totalIncome || data.totalExpense !== prev.totalExpense) {
            console.log('🎯 Account totals changed, updating goals...');
            console.log('🎯 Previous totals:', { totalIncome: prev.totalIncome, totalExpense: prev.totalExpense });
            console.log('🎯 New totals:', { totalIncome: data.totalIncome, totalExpense: data.totalExpense });
            
            // Call the function directly without setTimeout to ensure immediate execution
            updateAutoTrackedSavingsForAccount(updatedAccount.id, updatedAccount.totalIncome, updatedAccount.totalExpense);
          }
          
          return updatedAccount;
        });
      }
    });
    return () => unsubscribe();
  }, [user, selectedBankAccount?.id]);

  // Combined useEffect for both incomes and expenses real-time sync (selected bank account)
  useEffect(() => {
    if (!user || !selectedBankAccount) return;
    
    console.log('🔄 Setting up combined listener for account:', selectedBankAccount.id);
    
    let timeoutId: NodeJS.Timeout;
    let latestIncomes: Income[] = [];
    let latestExpenses: Expense[] = [];
    
    // Set up incomes listener
    const incomesRef = collection(db, 'users', user.uid, 'bankAccounts', selectedBankAccount.id, 'incomes');
    console.log('💰 Setting up incomes listener for path:', `users/${user.uid}/bankAccounts/${selectedBankAccount.id}/incomes`);
    
    const unsubscribeIncomes = onSnapshot(incomesRef, (snapshot) => {
      latestIncomes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Income[];
      console.log('💰 Real-time listener: Incomes updated, count:', latestIncomes.length);
      console.log('💰 Latest incomes:', latestIncomes.map(i => ({ id: i.id, amount: i.amount, bankAccountId: i.bankAccountId, description: i.description, source: i.source })));
      console.log('💰 Snapshot docs:', snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
      setIncomes(latestIncomes);
      
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Trigger recalculation with both latest incomes and expenses
      timeoutId = setTimeout(() => {
        console.log('🔄 Triggering recalculation after income update...');
        console.log('🔄 Using latest incomes:', latestIncomes.map(i => ({ id: i.id, amount: i.amount, bankAccountId: i.bankAccountId })));
        console.log('🔄 Using latest expenses:', latestExpenses.map(e => ({ id: e.id, amount: e.amount, bankAccountId: e.bankAccountId })));
        recalculateAndUpdateTotalsWithArray(selectedBankAccount.id, latestIncomes, latestExpenses);
      }, 200); // Debounced to prevent rapid recalculations
    });
    
    // Set up expenses listener
    const expensesRef = collection(db, 'users', user.uid, 'bankAccounts', selectedBankAccount.id, 'expenses');
    const unsubscribeExpenses = onSnapshot(expensesRef, (snapshot) => {
      latestExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
      console.log('💸 Real-time listener: Expenses updated, count:', latestExpenses.length);
      console.log('💸 Latest expenses:', latestExpenses.map(e => ({ id: e.id, amount: e.amount, bankAccountId: e.bankAccountId })));
      setExpenses(latestExpenses);
      
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Trigger recalculation with both latest incomes and expenses
      timeoutId = setTimeout(() => {
        console.log('🔄 Triggering recalculation after expense update...');
        console.log('🔄 Using latest incomes:', latestIncomes.map(i => ({ id: i.id, amount: i.amount, bankAccountId: i.bankAccountId })));
        console.log('🔄 Using latest expenses:', latestExpenses.map(e => ({ id: e.id, amount: e.amount, bankAccountId: e.bankAccountId })));
        recalculateAndUpdateTotalsWithArray(selectedBankAccount.id, latestIncomes, latestExpenses);
      }, 200); // Debounced to prevent rapid recalculations
    });
    
    return () => {
      unsubscribeIncomes();
      unsubscribeExpenses();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, selectedBankAccount?.id]);

  // Global expenses listener for budget calculations across all accounts
  useEffect(() => {
    if (!user || bankAccounts.length === 0) return;
    
    console.log('💸 Setting up global expenses listener for all accounts');
    
    const unsubscribeFunctions: (() => void)[] = [];
    let allExpenses: Expense[] = [];
    
    // Set up listeners for all bank accounts
    bankAccounts.forEach(account => {
      const expensesRef = collection(db, 'users', user.uid, 'bankAccounts', account.id, 'expenses');
      const unsubscribe = onSnapshot(expensesRef, (snapshot) => {
        const accountExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
        
        // Update the expenses for this specific account
        allExpenses = allExpenses.filter(exp => exp.bankAccountId !== account.id);
        allExpenses = [...allExpenses, ...accountExpenses];
        
        console.log(`💸 Global listener: Expenses updated for ${account.nickname || account.bankName}, total expenses across all accounts:`, allExpenses.length);
        
        // Update budget progress for all accounts
        updateAllBudgetProgress(budgets, allExpenses);
      });
      
      unsubscribeFunctions.push(unsubscribe);
    });
    
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [user, bankAccounts]);

  // Real-time listener for budgets (all bank accounts)
  useEffect(() => {
    if (!user) return;
    
    console.log('💰 Setting up budgets listener for all accounts');
    
    const budgetsRef = collection(db, 'users', user.uid, 'budgets');
    const unsubscribeBudgets = onSnapshot(budgetsRef, (snapshot) => {
      const allBudgets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Budget[];
      console.log('💰 Real-time listener: Budgets updated, total:', allBudgets.length);
      setBudgets(allBudgets);
    }, (error) => {
      console.error('Error listening to budgets:', error);
    });
    
    return () => unsubscribeBudgets();
  }, [user]);

  // Real-time listener for savings goals (global - no filtering needed)
  useEffect(() => {
    if (!user) return;
    
    console.log('🎯 Setting up savings goals listener (global) for user:', user.uid);
    
    const goalsRef = collection(db, 'users', user.uid, 'savingsGoals');
    console.log('🎯 Goals collection path:', `users/${user.uid}/savingsGoals`);
    
    const unsubscribeGoals = onSnapshot(goalsRef, (snapshot) => {
      console.log('🎯 Goals snapshot received, docs count:', snapshot.docs.length);
      const allGoals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SavingsGoal[];
      
      // Remove duplicates based on ID to prevent any duplicate issues
      const uniqueGoals = allGoals.filter((goal, index, self) => 
        index === self.findIndex(g => g.id === goal.id)
      );
      
      // Check for title duplicates and log them
      const titleDuplicates = uniqueGoals.filter((goal, index, self) => 
        self.findIndex(g => g.title.toLowerCase().trim() === goal.title.toLowerCase().trim()) !== index
      );
      
      if (titleDuplicates.length > 0) {
        console.warn('🎯 Found goals with duplicate titles:', titleDuplicates.map(g => ({ id: g.id, title: g.title })));
      }
      
      console.log('🎯 Real-time listener: Savings goals updated, count:', uniqueGoals.length);
      console.log('🎯 Goals data:', uniqueGoals.map(g => ({ id: g.id, title: g.title, targetAmount: g.targetAmount })));
      setSavingsGoals(uniqueGoals);
    }, (error) => {
      console.error('Error listening to savings goals:', error);
    });
    
    return () => {
      console.log('🎯 Cleaning up savings goals listener');
      unsubscribeGoals();
    };
  }, [user?.uid]); // Use user.uid instead of user object to prevent unnecessary re-renders

  // Bank Account operations
  const addBankAccount = async (accountData: Omit<BankAccount, 'id' | 'userId' | 'createdAt' | 'totalIncome' | 'totalExpense'>) => {
    if (!user) return;
    
    console.log('🏦 Creating new bank account with data:', accountData);
    
    const account = {
      ...accountData,
      id: generateId(),
      userId: user.uid,
      bankId: accountData.bankName,
      totalIncome: 0,
      totalExpense: 0,
      createdAt: new Date().toISOString(),
      startingBalance: accountData.startingBalance,
      currentBalance: accountData.startingBalance,
      monthlySavings: 0,
      savingsRate: 0
    };
    
    console.log('🏦 Created account object:', account);
    
    await saveBankAccountToStorage(account);
    console.log('🏦 Account saved to Firestore');
    
    // Create monthly summary for the current month
    const now = new Date();
    const monthName = format(now, 'LLLL'); // e.g. 'July'
    const monthAbbr = format(now, 'LLL').toLowerCase(); // e.g. 'jul'
    const year = now.getFullYear();
    const docId = `${monthAbbr}_${year}`;
    const summaryRef = doc(db, 'users', user.uid, 'bankAccounts', account.id, 'monthlySummaries', docId);
    // Initial summary with 0s
    await setDoc(summaryRef, {
      createdAt: new Date().toISOString(),
      month: monthName,
      year,
      monthlyIncome: 0,
      monthlyExpense: 0,
      monthlySavings: 0,
      savingsRate: 0
    });
    console.log('🏦 Monthly summary created for new account:', docId);

    // Immediately update the summary to include starting balance for the creation month
    await setDoc(summaryRef, {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      month: monthName,
      year,
      monthlyIncome: account.startingBalance || 0,
      monthlyExpense: 0,
      monthlySavings: account.startingBalance || 0,
      savingsRate: 100,
    }, { merge: true });
    
    setBankAccounts(prev => [...prev, account]);
    setSelectedBankAccount(account);
    
    console.log('🏦 Account added to local state, triggering recalculation...');
    
    // Pass the account data directly instead of relying on state
    setTimeout(() => {
      console.log('🏦 Starting recalculation for new account:', account.id);
      console.log('🏦 Current incomes:', incomes);
      console.log('🏦 Current expenses:', expenses);
      recalculateAndUpdateTotalsWithArrayDirect(account, incomes, expenses);
    }, 100);
  };

  // Utility to update monthly summary for the current month
  const updateCurrentMonthSummary = async ({
    userId,
    bankAccountId,
    incomes,
    expenses,
    account,
  }: {
    userId: string;
    bankAccountId: string;
    incomes: Income[];
    expenses: Expense[];
    account: BankAccount;
  }) => {
    const now = new Date();
    const monthAbbr = format(now, 'LLL').toLowerCase(); // always 'jul', 'aug', etc.
    const monthFull = format(now, 'LLLL'); // 'July', 'August', etc.
    const year = now.getFullYear();
    const docId = `${monthAbbr}_${year}`;

    // Filter for current month
    const monthlyIncomes = incomes.filter(
      (income) =>
        income.bankAccountId === bankAccountId &&
        isSameMonth(parseISO(income.date), now)
    );
    const monthlyExpenses = expenses.filter(
      (expense) =>
        expense.bankAccountId === bankAccountId &&
        isSameMonth(parseISO(expense.date), now)
    );
    let monthlyIncome = monthlyIncomes.reduce((sum, i) => sum + i.amount, 0);
    // Add starting balance if this is the creation month
    const creationDate = new Date(account.createdAt);
    const isSameMonthAsCreation = isSameMonth(creationDate, now);
    if (isSameMonthAsCreation) {
      monthlyIncome += account.startingBalance || 0;
    }
    const monthlyExpense = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlySavings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    const summaryRef = doc(
      db,
      'users',
      userId,
      'bankAccounts',
      bankAccountId,
      'monthlySummaries',
      docId
    );
    await setDoc(
      summaryRef,
      {
        month: monthFull, // for display
        year,
        monthlyIncome,
        monthlyExpense,
        monthlySavings,
        savingsRate,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  };

  // New function that accepts account data directly (for new accounts)
  const recalculateAndUpdateTotalsWithArrayDirect = async (account: BankAccount, incomesArray: Income[], expensesArray: Expense[]) => {
    if (!user) return;
    console.log('🔢 Starting direct recalculation for account:', account.id);
    console.log('🔢 Incomes array length:', incomesArray.length);
    console.log('🔢 Expenses array length:', expensesArray.length);
    
    const accountIncomes = incomesArray.filter(i => i.bankAccountId === account.id);
    const accountExpenses = expensesArray.filter(e => e.bankAccountId === account.id);
    
    console.log('🔢 Filtered incomes for this account:', accountIncomes.length);
    console.log('🔢 Filtered expenses for this account:', accountExpenses.length);
    console.log('🔢 All expenses in array:', expensesArray.map(e => ({ id: e.id, amount: e.amount, bankAccountId: e.bankAccountId })));
    console.log('🔢 Filtered expenses details:', accountExpenses.map(e => ({ id: e.id, amount: e.amount, bankAccountId: e.bankAccountId })));
    
    // Calculate monthly income and expense for the current month
    const now = new Date();
    const creationDate = new Date(account.createdAt);
    const isSameMonthAsCreation = isSameMonth(creationDate, now);
    const monthlyIncomes = accountIncomes.filter(i => isSameMonth(parseISO(i.date), now));
    const monthlyExpenses = accountExpenses.filter(e => isSameMonth(parseISO(e.date), now));
    let monthlyIncome = monthlyIncomes.reduce((sum, i) => sum + i.amount, 0);
    if (isSameMonthAsCreation) {
      monthlyIncome += account.startingBalance || 0;
    }
    const monthlyExpense = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlySavings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
    
    // Calculate totals from actual transactions
    const transactionIncome = accountIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = accountExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Use the account data passed directly
    const startingBalance = account.startingBalance || 0;
    
    // Total income should be only transaction incomes (starting balance is separate)
    const totalIncome = transactionIncome;
    
    // Current balance should be starting balance + total income minus total expenses
    const currentBalance = startingBalance + totalIncome - totalExpense;
    
    console.log('🔢 Recalculating totals for account:', account.id);
    console.log('💰 Transaction Income:', transactionIncome);
    console.log('💸 Total Expense:', totalExpense);
    console.log('🏦 Starting Balance:', startingBalance);
    console.log('📊 Total Income:', totalIncome);
    console.log('💎 Monthly Savings:', monthlySavings);
    console.log('📈 Savings Rate:', savingsRate.toFixed(2) + '%');
    console.log('💳 Current Balance:', currentBalance);
    
    const updatedAccount = {
      ...account,
      totalIncome,
      totalExpense,
      currentBalance,
      monthlySavings,
      savingsRate
    };
    
    console.log('🔢 Updating account with new totals:', updatedAccount);
    
    // Update Firestore
    const accountRef = doc(db, 'users', user!.uid, 'bankAccounts', account.id);
    await updateDoc(accountRef, {
      totalIncome,
      totalExpense,
      currentBalance,
      monthlySavings,
      savingsRate
    });
    
    console.log('🔢 Firestore updated successfully');
    
    // Update local state
    await updateBankAccount(updatedAccount);
    
    console.log('🔢 Local state updated successfully');
    
    // Update auto-tracked savings for all goals associated with this bank account
    await updateAutoTrackedSavingsForAccount(account.id, totalIncome, totalExpense);
    if (user) {
      await updateCurrentMonthSummary({
        userId: user.uid,
        bankAccountId: account.id,
        incomes: accountIncomes,
        expenses: accountExpenses,
        account: account,
      });
    }
  };

  // Utility: Recalculate totals and update Firestore (original version for existing accounts)
  const recalculateAndUpdateTotalsWithArray = async (bankAccountId: string, incomesArray: Income[], expensesArray: Expense[]) => {
    if (!user) return;
    console.log('🔢 Starting recalculation for account:', bankAccountId);
    console.log('🔢 Incomes array length:', incomesArray.length);
    console.log('🔢 Expenses array length:', expensesArray.length);
    
    const accountIncomes = incomesArray.filter(i => i.bankAccountId === bankAccountId);
    const accountExpenses = expensesArray.filter(e => e.bankAccountId === bankAccountId);
    
    console.log('🔢 Filtered incomes for this account:', accountIncomes.length);
    console.log('🔢 Filtered expenses for this account:', accountExpenses.length);
    console.log('🔢 All expenses in array:', expensesArray.map(e => ({ id: e.id, amount: e.amount, bankAccountId: e.bankAccountId })));
    console.log('🔢 Filtered expenses details:', accountExpenses.map(e => ({ id: e.id, amount: e.amount, bankAccountId: e.bankAccountId })));
    
    // Calculate monthly income and expense for the current month
    const now2 = new Date();
    const monthlyIncomes2 = accountIncomes.filter(i => isSameMonth(parseISO(i.date), now2));
    const monthlyExpenses2 = accountExpenses.filter(e => isSameMonth(parseISO(e.date), now2));
    const monthlyIncome2 = monthlyIncomes2.reduce((sum, i) => sum + i.amount, 0);
    const monthlyExpense2 = monthlyExpenses2.reduce((sum, e) => sum + e.amount, 0);
    
    // Calculate totals from actual transactions
    const transactionIncome = accountIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = accountExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Get account details for starting balance
    const account = bankAccounts.find(a => a.id === bankAccountId);
    console.log('🔢 Found account in bankAccounts:', account ? 'Yes' : 'No');
    console.log('🔢 Account details:', account);
    
    const startingBalance = account?.startingBalance || 0;
    
    // Total income should be only transaction incomes (starting balance is separate)
    const totalIncome = transactionIncome;
    
    // Current balance should be starting balance + total income minus total expenses
    const currentBalance = startingBalance + totalIncome - totalExpense;
    
    // Monthly savings should be the current balance (what's left after expenses)
    const monthlySavings = currentBalance;
    const savingsRate = totalIncome > 0 ? (monthlySavings / totalIncome) * 100 : 0;
    
    console.log('🔢 Recalculating totals for account:', bankAccountId);
    console.log('💰 Transaction Income:', transactionIncome);
    console.log('💸 Total Expense:', totalExpense);
    console.log('🏦 Starting Balance:', startingBalance);
    console.log('📊 Total Income:', totalIncome);
    console.log('💎 Monthly Savings:', monthlySavings);
    console.log('📈 Savings Rate:', savingsRate.toFixed(2) + '%');
    console.log('💳 Current Balance:', currentBalance);
    console.log('🔢 Selected bank account ID:', selectedBankAccount?.id);
    console.log('🔢 All bank accounts:', bankAccounts.map(a => ({ id: a.id, name: a.nickname || a.bankName, totalIncome: a.totalIncome, totalExpense: a.totalExpense })));
    
    if (account) {
      const updatedAccount = {
        ...account,
        totalIncome,
        totalExpense,
        currentBalance,
        monthlySavings,
        savingsRate
      };
      
      console.log('🔢 Updating account with new totals:', updatedAccount);
      
      // Update Firestore
      const accountRef = doc(db, 'users', user!.uid, 'bankAccounts', bankAccountId);
      await updateDoc(accountRef, {
        totalIncome,
        totalExpense,
        currentBalance,
        monthlySavings,
        savingsRate
      });
      
      console.log('🔢 Firestore updated successfully');
      
      // Update local state
      await updateBankAccount(updatedAccount);
      
      console.log('🔢 Local state updated successfully');
      
      // Update auto-tracked savings for all goals associated with this bank account
      await updateAutoTrackedSavingsForAccount(bankAccountId, totalIncome, totalExpense);
      console.log('🔢 updateAutoTrackedSavingsForAccount completed');
      if (user) {
        await updateCurrentMonthSummary({
          userId: user.uid,
          bankAccountId: bankAccountId,
          incomes: accountIncomes,
          expenses: accountExpenses,
          account: account,
        });
      }
    } else {
      console.error('🔢 ERROR: Account not found in bankAccounts array!');
      console.log('🔢 Available accounts:', bankAccounts.map(a => ({ id: a.id, name: a.nickname || a.bankName })));
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

  // Utility: Update auto-tracked savings for all savings goals associated with a bank account
  const updateAutoTrackedSavingsForAccount = async (bankAccountId: string, totalIncome: number, totalExpense: number) => {
    if (!user) return;
    
    // Get the account to access starting balance and current balance
    const account = bankAccounts.find(a => a.id === bankAccountId);
    if (!account) {
      console.error('🎯 Account not found for auto-tracking:', bankAccountId);
      return;
    }
    
    // Use current balance for auto-tracking (total available balance in the account)
    const totalAvailableBalance = account.currentBalance;
    console.log('🎯 Updating auto-tracked savings for account:', bankAccountId, 'total available balance:', totalAvailableBalance);
    console.log('🎯 Account details:', {
      startingBalance: account.startingBalance,
      totalIncome: account.totalIncome,
      totalExpense: account.totalExpense,
      currentBalance: account.currentBalance
    });
    
    // Fetch current goals from Firestore to ensure we have the latest data
    try {
      const goalsRef = collection(db, 'users', user.uid, 'savingsGoals');
      const goalsSnapshot = await getDocs(goalsRef);
      const currentGoals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SavingsGoal[];
      
      console.log('🎯 Fetched current goals from Firestore:', currentGoals.length);
      
      // Update all goals with the monthly savings from the selected account
      const updatedGoals = currentGoals.map(goal => {
        return {
          ...goal,
          autoTrackedAmount: Math.max(0, totalAvailableBalance)
        };
      });
      
      // Update goals in Firestore
      for (const goal of updatedGoals) {
        if (goal.autoTrackedAmount !== undefined) {
          try {
            const goalRef = doc(db, 'users', user.uid, 'savingsGoals', goal.id);
            await setDoc(goalRef, goal);
            console.log('🎯 Updated auto-tracked savings for goal:', goal.id, 'amount:', goal.autoTrackedAmount);
          } catch (error) {
            console.error('Error updating auto-tracked savings for goal:', goal.id, error);
          }
        }
      }
      console.log('🎯 Auto-tracked savings update completed for all goals');
    } catch (error) {
      console.error('Error fetching goals for auto-tracking update:', error);
    }
    // Don't manually update local state - let the real-time listener handle it
  };

  // Utility: Update auto-tracked savings for all goals when bank account changes
  const updateAllAutoTrackedSavings = async () => {
    if (!user || !selectedBankAccount) return;
    
    // Use current balance for auto-tracking (total available balance in the account)
    const totalAvailableBalance = selectedBankAccount.currentBalance;
    console.log('🎯 Updating all auto-tracked savings for account:', selectedBankAccount.id, 'total available balance:', totalAvailableBalance);
    console.log('🎯 Selected account details:', {
      startingBalance: selectedBankAccount.startingBalance,
      totalIncome: selectedBankAccount.totalIncome,
      totalExpense: selectedBankAccount.totalExpense,
      currentBalance: selectedBankAccount.currentBalance
    });
    
    // Fetch current goals from Firestore to ensure we have the latest data
    try {
      const goalsRef = collection(db, 'users', user.uid, 'savingsGoals');
      const goalsSnapshot = await getDocs(goalsRef);
      const currentGoals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SavingsGoal[];
      
      console.log('🎯 Fetched current goals from Firestore:', currentGoals.length);
      
      // Update all goals with the monthly savings from the selected account
      const updatedGoals = currentGoals.map(goal => {
        return {
          ...goal,
          autoTrackedAmount: Math.max(0, totalAvailableBalance)
        };
      });
      
      // Update goals in Firestore
      for (const goal of updatedGoals) {
        if (goal.autoTrackedAmount !== undefined) {
          try {
            const goalRef = doc(db, 'users', user.uid, 'savingsGoals', goal.id);
            await setDoc(goalRef, goal);
            console.log('🎯 Updated auto-tracked savings for goal:', goal.id, 'amount:', goal.autoTrackedAmount);
          } catch (error) {
            console.error('Error updating auto-tracked savings for goal:', goal.id, error);
          }
        }
      }
      console.log('🎯 Auto-tracked savings update completed for all goals');
    } catch (error) {
      console.error('Error fetching goals for auto-tracking update:', error);
    }
    // Don't manually update local state - let the real-time listener handle it
  };

  // Income operations
  const addIncome = async (incomeData: Omit<Income, 'id' | 'userId'>) => {
    if (!user) return;
    const income = {
      ...incomeData,
      id: generateId(),
      userId: user.uid
    };
    
    console.log('💰 Adding income:', income);
    console.log('💰 Income bankAccountId:', income.bankAccountId);
    console.log('💰 Selected bank account:', selectedBankAccount?.id);
    console.log('💰 Saving to path:', `users/${user.uid}/bankAccounts/${income.bankAccountId}/incomes/${income.id}`);
    
    const incomeRef = doc(
      db,
      'users',
      user.uid,
      'bankAccounts',
      income.bankAccountId,
      'incomes',
      income.id
    );
    
    try {
      await setDoc(incomeRef, income);
      console.log('💰 Income saved to Firestore successfully');
      console.log('💰 Saved income data:', income);
    } catch (error) {
      console.error('💰 Error saving income to Firestore:', error);
    }
    
    console.log('💰 Income saved to Firestore, waiting for real-time listener...');
    
    // Don't manually update local state - let the real-time listener handle it
    // This prevents duplication issues
  };

  const updateIncome = async (income: Income) => {
    console.log('💰 Updating income:', income);
    
    const incomeRef = doc(
      db,
      'users',
      user!.uid,
      'bankAccounts',
      income.bankAccountId,
      'incomes',
      income.id
    );
    
    await setDoc(incomeRef, income);
    console.log('💰 Income updated in Firestore, waiting for real-time listener...');
    
    // Don't manually update local state - let the real-time listener handle it
  };

  const deleteIncome = async (incomeId: string) => {
    const income = incomes.find(i => i.id === incomeId);
    if (!income || !user) return;
    
    console.log('💰 Deleting income:', income);
    
    const incomeRef = doc(
      db,
      'users',
      user.uid,
      'bankAccounts',
      income.bankAccountId,
      'incomes',
      incomeId
    );
    
    await deleteDoc(incomeRef);
    console.log('💰 Income deleted from Firestore, waiting for real-time listener...');
    
    // Don't manually update local state - let the real-time listener handle it
  };

  // Expense operations
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'userId'>) => {
    if (!user) return;
    const expense = {
      ...expenseData,
      id: generateId(),
      userId: user.uid
    };
    
    console.log('💸 Adding expense:', expense);
    console.log('💸 Expense bankAccountId:', expense.bankAccountId);
    console.log('💸 Selected bank account:', selectedBankAccount?.id);
    
    const expenseRef = doc(
      db,
      'users',
      user.uid,
      'bankAccounts',
      expense.bankAccountId,
      'expenses',
      expense.id
    );
    
    await setDoc(expenseRef, expense);
    console.log('💸 Expense saved to Firestore, waiting for real-time listener...');
    
    // Don't manually update local state - let the real-time listener handle it
    // This prevents duplication issues
  };

  const updateExpense = async (expense: Expense) => {
    console.log('💸 Updating expense:', expense);
    
    const expenseRef = doc(
      db,
      'users',
      user!.uid,
      'bankAccounts',
      expense.bankAccountId,
      'expenses',
      expense.id
    );
    
    await setDoc(expenseRef, expense);
    console.log('💸 Expense updated in Firestore, waiting for real-time listener...');
    
    // Don't manually update local state - let the real-time listener handle it
  };

  const deleteExpense = async (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense || !user) return;
    
    console.log('💸 Deleting expense:', expense);
    
    const expenseRef = doc(
      db,
      'users',
      user.uid,
      'bankAccounts',
      expense.bankAccountId,
      'expenses',
      expenseId
    );
    
    await deleteDoc(expenseRef);
    console.log('💸 Expense deleted from Firestore, waiting for real-time listener...');
    
    // Don't manually update local state - let the real-time listener handle it
  };

  // Budget operations
  const addBudget = async (budgetData: Omit<Budget, 'id' | 'userId'>) => {
    if (!user || !selectedBankAccount) return;
    
    const budget = {
      ...budgetData,
      id: generateId(),
      userId: user.uid,
      bankAccountId: selectedBankAccount.id // Ensure budget is tied to selected bank account
    };
    
    try {
      const budgetRef = doc(db, 'users', user.uid, 'budgets', budget.id);
      await setDoc(budgetRef, budget);
      console.log('💰 Budget saved to Firestore, waiting for real-time listener...');
    } catch (error) {
      console.error('Error saving budget to Firestore:', error);
    }
  };

  const updateBudget = async (budget: Budget) => {
    if (!user) return;
    
    try {
      const budgetRef = doc(db, 'users', user.uid, 'budgets', budget.id);
      await setDoc(budgetRef, budget);
      console.log('💰 Budget updated in Firestore, waiting for real-time listener...');
    } catch (error) {
      console.error('Error updating budget in Firestore:', error);
    }
  };

  // Savings Goal operations
  const addSavingsGoal = async (goalData: Omit<SavingsGoal, 'id' | 'userId'>) => {
    if (!user) return;
    
    console.log('🎯 Creating new savings goal with data:', goalData);
    
    // Check if a goal with the same title already exists (global check)
    const existingGoal = savingsGoals.find(goal => 
      goal.title.toLowerCase().trim() === goalData.title.toLowerCase().trim() &&
      goal.userId === user.uid
    );
    
    if (existingGoal) {
      console.warn('A goal with this title already exists:', goalData.title);
      console.warn('Existing goal:', existingGoal);
      return; // Don't create duplicate
    }
    
    // Calculate current monthly savings for auto-tracking (use selected account if available)
    const monthlySavings = selectedBankAccount ? 
      selectedBankAccount.totalIncome - selectedBankAccount.totalExpense : 0;
    
    const goal = {
      ...goalData,
      id: generateId(),
      userId: user.uid,
      // Remove bankAccountId entirely since goals are global
      autoTrackedAmount: Math.max(0, monthlySavings) // Initialize with current monthly savings
    };
    
    console.log('🎯 Created goal object:', goal);
    
    try {
      const goalRef = doc(db, 'users', user.uid, 'savingsGoals', goal.id);
      await setDoc(goalRef, goal);
      console.log('🎯 Savings goal saved to Firestore successfully, waiting for real-time listener...');
      await updateAllAutoTrackedSavings(); // Ensure auto-tracked savings is updated for all goals
    } catch (error) {
      console.error('Error saving savings goal to Firestore:', error);
    }
  };

  const updateSavingsGoal = async (goal: SavingsGoal) => {
    if (!user) return;
    
    try {
      const goalRef = doc(db, 'users', user.uid, 'savingsGoals', goal.id);
      await setDoc(goalRef, goal);
      console.log('🎯 Savings goal updated in Firestore, waiting for real-time listener...');
    } catch (error) {
      console.error('Error updating savings goal in Firestore:', error);
    }
  };

  const deleteSavingsGoal = async (goalId: string) => {
    if (!user) return;
    
    try {
      const goalRef = doc(db, 'users', user.uid, 'savingsGoals', goalId);
      await deleteDoc(goalRef);
      console.log('🎯 Savings goal deleted from Firestore, waiting for real-time listener...');
    } catch (error) {
      console.error('Error deleting savings goal from Firestore:', error);
    }
  };

  const deleteBudget = async (budgetId: string) => {
    if (!user) return;
    
    try {
      const budgetRef = doc(db, 'users', user.uid, 'budgets', budgetId);
      await deleteDoc(budgetRef);
      console.log('💰 Budget deleted from Firestore, waiting for real-time listener...');
    } catch (error) {
      console.error('Error deleting budget from Firestore:', error);
    }
  };

  // Note: Duplicate handling is now done at the Firestore level
  // Real-time listeners will automatically handle data consistency

  // Get budget notifications with bank account information
  const getBudgetNotifications = () => {
    const overBudget: Array<{ budget: Budget; bankAccount: BankAccount; progress: number }> = [];
    const alertBudgets: Array<{ budget: Budget; bankAccount: BankAccount; progress: number }> = [];

    budgets.forEach(budget => {
      if (!budget.bankAccountId) return;
      
      const progress = budgetProgress[budget.id] ?? 0;
      const bankAccount = bankAccounts.find(account => account.id === budget.bankAccountId);
      
      if (!bankAccount) return;
      
      if (progress >= 100) {
        overBudget.push({ budget, bankAccount, progress });
      } else if (progress >= budget.alertThreshold) {
        alertBudgets.push({ budget, bankAccount, progress });
      }
    });

    return { overBudget, alertBudgets };
  };

  // Add recalcAndUpdate function for monthly summaries
  const recalcAndUpdate = async (latestIncomes: Income[], latestExpenses: Expense[]) => {
    if (!user || !selectedBankAccount) return;

    const now = new Date();
    const currentMonthId = format(now, 'MMM_yyyy').toLowerCase(); // e.g. jul_2025
    const displayMonth = format(now, 'LLLL'); // e.g. July
    const year = now.getFullYear();

    // Detect if this is the creation month
    const creationDate = new Date(selectedBankAccount.createdAt);
    const isSameMonthAsCreation = isSameMonth(creationDate, now);

    // Calculate monthly income (add startingBalance only in creation month)
    let monthlyIncome = latestIncomes
      .filter((item) => isSameMonth(parseISO(item.date), now))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    if (isSameMonthAsCreation) {
      monthlyIncome += selectedBankAccount.startingBalance || 0;
    }

    // Calculate monthly expense
    const monthlyExpense = latestExpenses
      .filter((item) => isSameMonth(parseISO(item.date), now))
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // Calculate savings and rate
    const monthlySavings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    // Save to Firestore
    const summaryRef = doc(
      db,
      'users',
      user.uid,
      'bankAccounts',
      selectedBankAccount.id,
      'monthlySummaries',
      currentMonthId
    );
    await setDoc(summaryRef, {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      month: displayMonth,
      year,
      monthlyIncome,
      monthlyExpense,
      monthlySavings,
      savingsRate,
    }, { merge: true });

    // Also update all-time totalIncome/totalExpense if needed
    const totalIncome = latestIncomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = latestExpenses.reduce((sum, e) => sum + e.amount, 0);
    const effectiveIncome = totalIncome > 0 ? totalIncome : selectedBankAccount.startingBalance || 0;
    const allTimeSavings = effectiveIncome - totalExpense;
    const overallRate = effectiveIncome > 0 ? (allTimeSavings / effectiveIncome) * 100 : 0;

    const accountRef = doc(db, 'users', user.uid, 'bankAccounts', selectedBankAccount.id);
    await updateDoc(accountRef, {
      totalIncome,
      totalExpense,
      monthlySavings: allTimeSavings,
      savingsRate: overallRate
    });
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
    updateAllAutoTrackedSavings,
    getBudgetNotifications
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
