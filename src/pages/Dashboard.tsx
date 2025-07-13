import React, { useState } from 'react';
import { BarChart3, PieChart } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  calculateFinancialSummary
} from '../utils/calculations';
import DashboardStats from '../components/dashboard/DashboardStats';
import ExpenseChart from '../components/dashboard/ExpenseChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import UpcomingBills from '../components/dashboard/UpcomingBills';
import QuickActions from '../components/QuickActions';
import BankAccountSelector from '../components/BankAccountSelector';

interface DashboardProps {
  onPageChange?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onPageChange }) => {
  const { incomes, expenses, budgets, selectedBankAccount } = useData();
  const { themeConfig, currentTheme } = useTheme();
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  // ✅ Filter incomes and expenses by selected bank account
  const filteredIncomes = selectedBankAccount
    ? incomes.filter((income) => income.bankAccountId === selectedBankAccount.id)
    : incomes;

  const filteredExpenses = selectedBankAccount
    ? expenses.filter((expense) => expense.bankAccountId === selectedBankAccount.id)
    : expenses;

  // Debug logs
  console.log('📊 Dashboard - Selected bank account:', selectedBankAccount ? { id: selectedBankAccount.id, name: selectedBankAccount.nickname || selectedBankAccount.bankName, startingBalance: selectedBankAccount.startingBalance } : 'null');
  console.log('📊 Dashboard - All incomes:', incomes.map(i => ({ id: i.id, amount: i.amount, bankAccountId: i.bankAccountId, description: i.description })));
  console.log('📊 Dashboard - All expenses:', expenses.map(e => ({ id: e.id, amount: e.amount, bankAccountId: e.bankAccountId, description: e.description })));
  console.log('📊 Dashboard - Filtered incomes:', filteredIncomes.map(i => ({ id: i.id, amount: i.amount, bankAccountId: i.bankAccountId, description: i.description })));
  console.log('📊 Dashboard - Filtered expenses:', filteredExpenses.map(e => ({ id: e.id, amount: e.amount, bankAccountId: e.bankAccountId, description: e.description })));

  // ✅ Use actual transaction data for consistent calculations
  // For new users, total income should include starting balance
  const summary = selectedBankAccount ? {
    // Calculate total income: transaction incomes + starting balance
    totalIncome: filteredIncomes.reduce((sum, income) => sum + income.amount, 0) + selectedBankAccount.startingBalance,
    // Calculate actual expenses from transactions
    totalExpenses: filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    savings: (filteredIncomes.reduce((sum, income) => sum + income.amount, 0) + selectedBankAccount.startingBalance) - filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    savingsRate: (filteredIncomes.reduce((sum, income) => sum + income.amount, 0) + selectedBankAccount.startingBalance) > 0 ? 
      (((filteredIncomes.reduce((sum, income) => sum + income.amount, 0) + selectedBankAccount.startingBalance) - filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)) / (filteredIncomes.reduce((sum, income) => sum + income.amount, 0) + selectedBankAccount.startingBalance)) * 100 : 0,
    monthlyBudgetUsed: filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    monthlyBudgetRemaining: 0, // TODO: Calculate from budgets
    upcomingBills: [] // TODO: Calculate from expenses
  } : {
    totalIncome: 0,
    totalExpenses: 0,
    savings: 0,
    savingsRate: 0,
    monthlyBudgetUsed: 0,
    monthlyBudgetRemaining: 0,
    upcomingBills: []
  };

  // Debug summary calculation
  console.log('📊 Dashboard - Summary calculation:', {
    hasSelectedAccount: !!selectedBankAccount,
    totalIncome: summary.totalIncome,
    totalExpenses: summary.totalExpenses,
    savings: summary.savings,
    savingsRate: summary.savingsRate
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>
            Dashboard
          </h1>
          <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
            Overview of your financial health and recent activity
          </p>
        </div>
        <div
          className={`flex items-center space-x-2 ${themeConfig.classes.container} rounded-lg p-1 shadow-sm border border-gray-700`}
        >
          <button
            onClick={() => setChartType('pie')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              chartType === 'pie'
                ? 'bg-red-900 text-red-300'
                : `${themeConfig.classes.textMuted} hover:${themeConfig.classes.text} hover:bg-gray-700`
            }`}
          >
            <PieChart className="h-4 w-4" />
            <span>Pie Chart</span>
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              chartType === 'bar'
                ? 'bg-red-900 text-red-300'
                : `${themeConfig.classes.textMuted} hover:${themeConfig.classes.text} hover:bg-gray-700`
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Bar Chart</span>
          </button>
        </div>
      </div>

      {/* Bank Account Selector */}
      <BankAccountSelector />

      {/* Quick Actions */}
      <QuickActions onPageChange={onPageChange} />

      {/* Stats Cards */}
      <DashboardStats summary={summary} />

      {/* Charts and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ExpenseChart expenses={filteredExpenses} chartType={chartType} />
        <RecentTransactions incomes={filteredIncomes} expenses={filteredExpenses} />
      </div>

      {/* Upcoming Bills */}
      <UpcomingBills />
    </div>
  );
};

export default Dashboard;
