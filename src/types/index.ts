export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  bankId: string;
  bankName: string;
  nickname?: string;
  startingBalance: number;
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  createdAt: string;
  isActive: boolean;
}

export interface Income {
  id: string;
  userId: string;
  bankAccountId: string;
  source: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'one-time';
  date: string;
  description?: string;
}

export interface Expense {
  id: string;
  userId: string;
  bankAccountId: string;
  category: string;
  subcategory?: string;
  amount: number;
  date: string;
  description?: string;
  isRecurring: boolean;
  frequency?: 'monthly' | 'yearly';
  nextDueDate?: string;
}

export interface Budget {
  id: string;
  userId: string;
  bankAccountId?: string; // Optional - can be account-specific or global
  category: string;
  budgetAmount: number;
  period: 'monthly' | 'yearly';
  alertThreshold: number;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  bankAccountId?: string; // Optional - can be account-specific or global
  title: string;
  targetAmount: number;
  currentAmount: number;
  autoTrackedAmount?: number; // Auto-calculated savings from income - expenses
  targetDate: string;
  description?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories?: string[];
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
  monthlyBudgetUsed: number;
  monthlyBudgetRemaining: number;
  upcomingBills: Expense[];
}

export interface BankAccountSummary {
  account: BankAccount;
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  savings: number;
  savingsRate: number;
  recentTransactions: (Income | Expense)[];
}

export interface BillReminder {
  id: string;
  userId: string;
  billName: string;
  dueDate: string;
  reminderTime: 'same-day' | '1-day-before' | '3-days-before';
  notes?: string;
  isPaid: boolean;
  createdAt: string;
}