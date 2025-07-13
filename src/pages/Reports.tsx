// Keep your imports as they are
import React, { useState } from 'react';
import {
  BarChart3, PieChart, TrendingUp, Download, Calendar, Building,
  DollarSign, Target, Wallet, FileText
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { getBankById } from '../utils/banks';
import { defaultExpenseCategories } from '../utils/categories';
import { exportFinancialReport } from '../utils/exportFinancialReport';
import {
  startOfYear, endOfYear, eachMonthOfInterval, format,
  startOfMonth, endOfMonth, parseISO, isSameMonth, isAfter
} from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';
import BankAccountSelector from '../components/BankAccountSelector';
import { formatCurrency } from '../utils/calculations';
import { useMonthlySummaries } from '../utils/useMonthlySummaries';

const Reports: React.FC = () => {
  const { bankAccounts, selectedBankAccount, incomes, expenses, budgets, savingsGoals } = useData();
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState<'accounts' | 'monthly' | 'category' | 'trends'>('accounts');

  // Fetch monthly summaries for the selected bank account and year
  const { summaries: monthlySummaries, loading: loadingSummaries } = useMonthlySummaries(
    user?.uid,
    selectedBankAccount?.id,
    selectedYear
  );

  const currentDate = new Date();
  const yearStart = startOfYear(new Date(selectedYear, 0, 1));
  const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const categoryData = defaultExpenseCategories.map(category => {
    const categoryTotal = selectedBankAccount
      ? expenses
          .filter(e => e.bankAccountId === selectedBankAccount.id && e.category === category.id)
          .reduce((sum, e) => sum + e.amount, 0)
      : 0;

    return {
      name: category.name,
      value: categoryTotal,
      color: category.color
    };
  }).filter(item => item.value > 0);

  // Calculate percentages for the filtered category data
  const totalExpenses = categoryData.reduce((sum, item) => sum + item.value, 0);
  const categoryDataWithPercentages = categoryData.map(item => ({
    ...item,
    percentage: totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0
  }));

  console.log('📊 Category data for PDF:', categoryDataWithPercentages);

  const { showToast } = useToast();
  
  // Map monthlySummaries to MonthlyData[] shape for PDF export and charts
  const creationDate = selectedBankAccount ? new Date(selectedBankAccount.createdAt) : null;
  const creationMonth = creationDate ? creationDate.toLocaleString('default', { month: 'long' }).toLowerCase() : '';
  const creationYear = creationDate ? creationDate.getFullYear() : null;
  const monthlyData = monthlySummaries.map((summary) => {
    const isCreationMonth = creationDate &&
      summary.year === creationYear &&
      summary.month.toLowerCase() === creationMonth;
    const calculatedRate = summary.monthlyIncome > 0
      ? (summary.monthlySavings / summary.monthlyIncome) * 100
      : 0;
    return {
      month: summary.month,
      income: summary.monthlyIncome,
      expenses: summary.monthlyExpense,
      savings: summary.monthlySavings,
      savingsRate: typeof summary.savingsRate === 'number' && summary.savingsRate !== 0
        ? summary.savingsRate
        : calculatedRate,
      includesInitialBalance: !!isCreationMonth,
    };
  });

  // Debug: Log the monthlyData for charts
  console.log('📊 monthlyData for charts:', monthlyData);

  const downloadPDFReport = async () => {
    if (!user || !selectedBankAccount) return;
    
    try {
      const startingBalance = selectedBankAccount.startingBalance;
      const totalIncome = startingBalance + incomes.filter(i => i.bankAccountId === selectedBankAccount.id).reduce((sum, i) => sum + i.amount, 0);
      const effectiveIncome = totalIncome > 0 ? totalIncome : startingBalance;
      const totalExpense = expenses.filter(e => e.bankAccountId === selectedBankAccount.id).reduce((sum, e) => sum + e.amount, 0);
      const currentBalance = effectiveIncome - totalExpense;
      const monthlySavings = currentBalance;
      const savingsRate = effectiveIncome > 0 ? (monthlySavings / effectiveIncome) * 100 : 0;
      await exportFinancialReport(
        {
          displayName: user.displayName || '',
          email: user.email || ''
        },
        [
          {
            bankName: selectedBankAccount.bankName,
            nickname: selectedBankAccount.nickname,
            startingBalance,
            totalIncome,
            totalExpense,
            currentBalance,
            createdAt: selectedBankAccount.createdAt,
            monthlySavings,
            savingsRate,
            transactionCount:
              incomes.filter(i => i.bankAccountId === selectedBankAccount.id).length +
              expenses.filter(e => e.bankAccountId === selectedBankAccount.id).length
          }
        ],
        monthlyData,
        selectedYear,
        categoryDataWithPercentages,
        [],
        budgets.filter(b => b.bankAccountId === selectedBankAccount.id),
        savingsGoals,
        expenses.filter(e => e.bankAccountId === selectedBankAccount.id)
      );
      
      // Show success toast for all users
      showToast('PDF report downloaded successfully!', 'success');
    } catch (error) {
      showToast('Failed to download PDF report. Please try again.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>Reports</h1>
          <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>View financial insights for your accounts</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-gray-700 text-white rounded px-3 py-2"
          >
            {[...Array(new Date().getFullYear() - 2024).keys()].map(i => {
              const year = 2025 + i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
          <button
            onClick={downloadPDFReport}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            PDF for This Account
          </button>
        </div>
      </div>

      <BankAccountSelector />

      {/* Trend chart */}
      {selectedBankAccount && (
        <>
          <div className="mb-4">
            <h2 className={`text-xl font-semibold ${currentTheme === 'vibrant' ? 'text-sky-500' : 'text-white'}`}>Monthly Income vs Expenses</h2>
            <p className="text-gray-400 text-sm">
              Analysis for: {selectedBankAccount.nickname || selectedBankAccount.bankName} 
              {selectedBankAccount.nickname && selectedBankAccount.nickname !== selectedBankAccount.bankName && ` (${selectedBankAccount.bankName})`}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" tickFormatter={val => `₹${val / 1000}k`} />
                <Tooltip formatter={val => formatCurrency(Number(val))} />
                <Bar dataKey="income" fill="#10B981" name="Income" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Savings trend */}
      {selectedBankAccount && (
        <>
          <div className="mb-4 mt-10">
            <h2 className={`text-xl font-semibold ${currentTheme === 'vibrant' ? 'text-sky-500' : 'text-white'}`}>Monthly Savings</h2>
            <p className="text-gray-400 text-sm">
              Analysis for: {selectedBankAccount.nickname || selectedBankAccount.bankName} 
              {selectedBankAccount.nickname && selectedBankAccount.nickname !== selectedBankAccount.bankName && ` (${selectedBankAccount.bankName})`}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(val) => formatCurrency(Number(val))} />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Expense Category Breakdown */}
      {selectedBankAccount && (
        <>
          <div className="mb-4 mt-10">
            <h2 className={`text-xl font-semibold ${currentTheme === 'vibrant' ? 'text-sky-500' : 'text-white'}`}>Category Breakdown</h2>
            <p className="text-gray-400 text-sm">
              Analysis for: {selectedBankAccount.nickname || selectedBankAccount.bankName} 
              {selectedBankAccount.nickname && selectedBankAccount.nickname !== selectedBankAccount.bankName && ` (${selectedBankAccount.bankName})`}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Fallback when no account selected */}
      {!selectedBankAccount && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-xl font-semibold">No Bank Account Selected</p>
          <p>Please select a bank account to view detailed reports.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;

