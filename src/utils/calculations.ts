import { Income, Expense, Budget, FinancialSummary, BankAccount } from '../types';
import { startOfMonth, endOfMonth, addMonths, isBefore, parseISO, isWithinInterval } from 'date-fns';

export const calculateMonthlyIncome = (incomes: Income[], date: Date = new Date()): number => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  return incomes.reduce((total, income) => {
    const incomeDate = parseISO(income.date);
    
    if (income.frequency === 'monthly') {
      return total + income.amount;
    } else if (income.frequency === 'yearly') {
      return total + (income.amount / 12);
    } else if (income.frequency === 'one-time' && 
               incomeDate >= monthStart && incomeDate <= monthEnd) {
      return total + income.amount;
    }
    
    return total;
  }, 0);
};

export const calculateMonthlyExpenses = (expenses: Expense[], date: Date = new Date()): number => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  return expenses.reduce((total, expense) => {
    const expenseDate = parseISO(expense.date);
    
    // Include recurring monthly expenses
    if (expense.isRecurring && expense.frequency === 'monthly') {
      return total + expense.amount;
    } 
    // Include yearly expenses (divided by 12)
    else if (expense.isRecurring && expense.frequency === 'yearly') {
      return total + (expense.amount / 12);
    } 
    // Include ALL one-time expenses that fall within the current month
    else if (!expense.isRecurring && 
             isWithinInterval(expenseDate, { start: monthStart, end: monthEnd })) {
      return total + expense.amount;
    }
    
    return total;
  }, 0);
};

export const calculateCategoryExpenses = (expenses: Expense[], category: string, date: Date = new Date()): number => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  return expenses
    .filter(expense => expense.category === category)
    .reduce((total, expense) => {
      const expenseDate = parseISO(expense.date);
      
      // Include recurring monthly expenses for this category
      if (expense.isRecurring && expense.frequency === 'monthly') {
        return total + expense.amount;
      } 
      // Include yearly expenses (divided by 12) for this category
      else if (expense.isRecurring && expense.frequency === 'yearly') {
        return total + (expense.amount / 12);
      } 
      // Include ALL one-time expenses in this category for the current month
      else if (!expense.isRecurring && 
               isWithinInterval(expenseDate, { start: monthStart, end: monthEnd })) {
        return total + expense.amount;
      }
      
      return total;
    }, 0);
};

export const getUpcomingBills = (expenses: Expense[], daysAhead: number = 7): Expense[] => {
  const now = new Date();
  const futureDate = addMonths(now, 1);

  return expenses
    .filter(expense => expense.isRecurring && expense.nextDueDate)
    .filter(expense => {
      const dueDate = parseISO(expense.nextDueDate!);
      return dueDate >= now && dueDate <= futureDate;
    })
    .sort((a, b) => parseISO(a.nextDueDate!).getTime() - parseISO(b.nextDueDate!).getTime());
};

export const calculateFinancialSummary = (
  incomes: Income[], 
  expenses: Expense[], 
  budgets: Budget[],
  startingBalance: number = 0,
  date: Date = new Date()
): FinancialSummary => {
  const totalIncome = calculateMonthlyIncome(incomes, date);
  const totalExpenses = calculateMonthlyExpenses(expenses, date);
  const effectiveIncome = totalIncome > 0 ? totalIncome : startingBalance;
  const savings = effectiveIncome - totalExpenses;
  const savingsRate = effectiveIncome > 0 ? (savings / effectiveIncome) * 100 : 0;
  
  const monthlyBudget = budgets
    .filter(budget => budget.period === 'monthly')
    .reduce((total, budget) => total + budget.budgetAmount, 0);
  
  const monthlyBudgetUsed = totalExpenses;
  const monthlyBudgetRemaining = monthlyBudget - monthlyBudgetUsed;
  
  const upcomingBills = getUpcomingBills(expenses);

  return {
    totalIncome,
    totalExpenses,
    savings,
    savingsRate,
    monthlyBudgetUsed,
    monthlyBudgetRemaining,
    upcomingBills
  };
};

export const calculateFinancialSummaryWithAccount = (
  incomes: Income[], 
  expenses: Expense[], 
  budgets: Budget[],
  selectedAccount: BankAccount | null,
  date: Date = new Date()
): FinancialSummary => {
  const totalIncome = selectedAccount ? selectedAccount.totalIncome : 0;
  const totalExpenses = calculateMonthlyExpenses(expenses, date);
  const startingBalance = selectedAccount ? selectedAccount.startingBalance : 0;
  const effectiveIncome = totalIncome > 0 ? totalIncome : startingBalance;
  const savings = effectiveIncome - totalExpenses;
  const savingsRate = effectiveIncome > 0 ? (savings / effectiveIncome) * 100 : 0;

  const monthlyBudget = budgets
    .filter(budget => budget.period === 'monthly')
    .reduce((total, budget) => total + budget.budgetAmount, 0);

  const monthlyBudgetUsed = totalExpenses;
  const monthlyBudgetRemaining = monthlyBudget - monthlyBudgetUsed;

  const upcomingBills = getUpcomingBills(expenses);

  return {
    totalIncome,
    totalExpenses,
    savings,
    savingsRate,
    monthlyBudgetUsed,
    monthlyBudgetRemaining,
    upcomingBills
  };
};

export const formatCurrency = (value: number): string => {
  return `Rs. ${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const calculateBudgetProgress = (expenses: Expense[], budget: Budget, date: Date = new Date(), bankAccountId?: string): number => {
  // Filter expenses by bank account if specified
  const filteredExpenses = bankAccountId 
    ? expenses.filter(expense => expense.bankAccountId === bankAccountId)
    : expenses;
  
  const categoryExpenses = calculateCategoryExpenses(filteredExpenses, budget.category, date);
  return budget.budgetAmount > 0 ? (categoryExpenses / budget.budgetAmount) * 100 : 0;
};

/**
 * Rounds a number to exactly 2 decimal places
 * @param value - The number to round
 * @returns The rounded number with exactly 2 decimal places
 */
export const roundToTwoDecimals = (value: number): number => {
  return Number(value.toFixed(2));
};

/**
 * Validates and rounds a string input to 2 decimal places
 * @param input - The string input to validate and round
 * @returns The rounded number or null if invalid
 */
export const validateAndRoundAmount = (input: string): number | null => {
  const cleaned = parseFloat(input);
  if (isNaN(cleaned) || cleaned < 0) {
    return null;
  }
  return roundToTwoDecimals(cleaned);
};