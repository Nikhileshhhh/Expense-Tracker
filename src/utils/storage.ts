import { Income, Expense, Budget, SavingsGoal, BankAccount } from '../types';
import { db } from '../firebase';
import { doc, setDoc, getDocs, collection, deleteDoc, updateDoc } from 'firebase/firestore';

const INCOME_KEY = 'expense_tracker_income';
const EXPENSES_KEY = 'expense_tracker_expenses';
const BUDGETS_KEY = 'expense_tracker_budgets';
const SAVINGS_GOALS_KEY = 'expense_tracker_savings_goals';
const BANK_ACCOUNTS_KEY = 'expense_tracker_bank_accounts';

// Bank Account operations - Firestore
export const getBankAccounts = async (userId: string): Promise<BankAccount[]> => {
  const ref = collection(db, `users/${userId}/bankAccounts`);
  const snapshot = await getDocs(ref);
  return snapshot.docs.map(doc => doc.data() as BankAccount);
};

export const saveBankAccount = async (account: BankAccount): Promise<void> => {
  const ref = doc(db, `users/${account.userId}/bankAccounts/${account.id}`);
  await setDoc(ref, account);
};

export const deleteBankAccount = async (accountId: string, userId: string): Promise<void> => {
  const ref = doc(db, `users/${userId}/bankAccounts/${accountId}`);
  await deleteDoc(ref);
};

export const updateBankAccountBalance = async (accountId: string, newBalance: number, userId: string): Promise<void> => {
  const ref = doc(db, `users/${userId}/bankAccounts/${accountId}`);
  await updateDoc(ref, { currentBalance: newBalance });
};

export const updateBankAccountTotals = async (accountId: string, totalIncome: number, totalExpense: number, userId: string): Promise<void> => {
  const ref = doc(db, `users/${userId}/bankAccounts/${accountId}`);
  await updateDoc(ref, { 
    totalIncome: totalIncome,
    totalExpense: totalExpense 
  });
};

// Income operations
export const getIncomes = (userId: string, bankAccountId?: string): Income[] => {
  const incomes = JSON.parse(localStorage.getItem(INCOME_KEY) || '[]');
  let filteredIncomes = incomes.filter((income: Income) => income.userId === userId);
  
  if (bankAccountId) {
    filteredIncomes = filteredIncomes.filter((income: Income) => income.bankAccountId === bankAccountId);
  }
  
  return filteredIncomes;
};

export const saveIncome = (income: Income): void => {
  const incomes = JSON.parse(localStorage.getItem(INCOME_KEY) || '[]');
  const existingIndex = incomes.findIndex((i: Income) => i.id === income.id);
  
  if (existingIndex >= 0) {
    incomes[existingIndex] = income;
  } else {
    incomes.push(income);
  }
  
  localStorage.setItem(INCOME_KEY, JSON.stringify(incomes));
};

export const deleteIncome = (incomeId: string): void => {
  const incomes = JSON.parse(localStorage.getItem(INCOME_KEY) || '[]');
  const filteredIncomes = incomes.filter((i: Income) => i.id !== incomeId);
  localStorage.setItem(INCOME_KEY, JSON.stringify(filteredIncomes));
};

// Expense operations
export const getExpenses = (userId: string, bankAccountId?: string): Expense[] => {
  const expenses = JSON.parse(localStorage.getItem(EXPENSES_KEY) || '[]');
  let filteredExpenses = expenses.filter((expense: Expense) => expense.userId === userId);
  
  if (bankAccountId) {
    filteredExpenses = filteredExpenses.filter((expense: Expense) => expense.bankAccountId === bankAccountId);
  }
  
  return filteredExpenses;
};

export const saveExpense = (expense: Expense): void => {
  const expenses = JSON.parse(localStorage.getItem(EXPENSES_KEY) || '[]');
  const existingIndex = expenses.findIndex((e: Expense) => e.id === expense.id);
  
  if (existingIndex >= 0) {
    expenses[existingIndex] = expense;
  } else {
    expenses.push(expense);
  }
  
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
};

export const deleteExpense = (expenseId: string): void => {
  const expenses = JSON.parse(localStorage.getItem(EXPENSES_KEY) || '[]');
  const filteredExpenses = expenses.filter((e: Expense) => e.id !== expenseId);
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(filteredExpenses));
};

// Budget operations
export const getBudgets = (userId: string, bankAccountId?: string): Budget[] => {
  const budgets = JSON.parse(localStorage.getItem(BUDGETS_KEY) || '[]');
  let filteredBudgets = budgets.filter((budget: Budget) => budget.userId === userId);
  
  if (bankAccountId) {
    // Only show budgets for the specific bank account (no global fallback)
    filteredBudgets = filteredBudgets.filter((budget: Budget) => 
      budget.bankAccountId === bankAccountId
    );
  }
  
  return filteredBudgets;
};

export const saveBudget = (budget: Budget): void => {
  const budgets = JSON.parse(localStorage.getItem(BUDGETS_KEY) || '[]');
  const existingIndex = budgets.findIndex((b: Budget) => b.id === budget.id);
  
  if (existingIndex >= 0) {
    budgets[existingIndex] = budget;
  } else {
    budgets.push(budget);
  }
  
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
};

export const deleteBudget = (budgetId: string): void => {
  const budgets = JSON.parse(localStorage.getItem(BUDGETS_KEY) || '[]');
  const filteredBudgets = budgets.filter((b: Budget) => b.id !== budgetId);
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(filteredBudgets));
};

// Savings goals operations
export const getSavingsGoals = (userId: string, bankAccountId?: string): SavingsGoal[] => {
  const goals = JSON.parse(localStorage.getItem(SAVINGS_GOALS_KEY) || '[]');
  // Goals are global - return all goals for the user
  return goals.filter((goal: SavingsGoal) => goal.userId === userId);
};

export const saveSavingsGoal = (goal: SavingsGoal): void => {
  const goals = JSON.parse(localStorage.getItem(SAVINGS_GOALS_KEY) || '[]');
  const existingIndex = goals.findIndex((g: SavingsGoal) => g.id === goal.id);
  
  if (existingIndex >= 0) {
    goals[existingIndex] = goal;
  } else {
    goals.push(goal);
  }
  
  localStorage.setItem(SAVINGS_GOALS_KEY, JSON.stringify(goals));
};

export const deleteSavingsGoal = (goalId: string, userId?: string): void => {
  const goals = JSON.parse(localStorage.getItem(SAVINGS_GOALS_KEY) || '[]');
  let filteredGoals;
  
  if (userId) {
    // If userId is provided, only delete goals for that user
    filteredGoals = goals.filter((g: SavingsGoal) => !(g.id === goalId && g.userId === userId));
  } else {
    // If no userId provided, delete by ID only (for backward compatibility)
    filteredGoals = goals.filter((g: SavingsGoal) => g.id !== goalId);
  }
  
  localStorage.setItem(SAVINGS_GOALS_KEY, JSON.stringify(filteredGoals));
};

export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};