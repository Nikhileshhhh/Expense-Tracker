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
  date: Date = new Date()
): FinancialSummary => {
  const totalIncome = calculateMonthlyIncome(incomes, date);
  const totalExpenses = calculateMonthlyExpenses(expenses, date);
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
  
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
  // Use the DB value for totalIncome, which already includes startingBalance
  const totalIncome = selectedAccount ? selectedAccount.totalIncome : 0;
  const totalExpenses = calculateMonthlyExpenses(expenses, date);
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

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

export const calculateBudgetProgress = (expenses: Expense[], budget: Budget, date: Date = new Date()): number => {
  const categoryExpenses = calculateCategoryExpenses(expenses, budget.category, date);
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