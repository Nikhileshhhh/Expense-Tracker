import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Download, Calendar, Building, DollarSign, Target, Wallet, FileText } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { defaultExpenseCategories } from '../utils/categories';
import { startOfYear, endOfYear, eachMonthOfInterval, format, startOfMonth, parseISO, isAfter, isSameMonth, isBefore, endOfMonth } from 'date-fns';
import { useTheme } from '../contexts/ThemeContext';
import BankAccountSelector from '../components/BankAccountSelector';
import { getBankById } from '../utils/banks';
import { exportFinancialReport } from '../utils/exportFinancialReport';

const Reports: React.FC = () => {
  const { bankAccounts, incomes, expenses, selectedBankAccount } = useData();
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportType, setReportType] = useState<'accounts' | 'monthly' | 'category' | 'trends'>('accounts');

  // Calculate per-bank account analysis
  const bankAccountAnalysis = bankAccounts.map(account => {
    // Get incomes and expenses for this specific account
    const accountIncomes = incomes.filter(income => income.bankAccountId === account.id);
    const accountExpenses = expenses.filter(expense => expense.bankAccountId === account.id);

    // Use DB value for totalIncome only
    const totalIncome = account.totalIncome;
    const startingBalance = account.startingBalance;
    const totalAvailable = totalIncome;
    const currentBalance = totalIncome - account.totalExpense;
    const monthlySavings = currentBalance;
    const savingsRate = totalIncome > 0 ? (monthlySavings / totalIncome) * 100 : 0;

    return {
      account,
      initialBalance: startingBalance,
      totalIncome,
      totalAvailable,
      totalExpense: account.totalExpense,
      currentBalance,
      monthlySavings,
      savingsRate,
      transactionCount: accountIncomes.length + accountExpenses.length
    };
  });

  // Generate monthly data for selected year and selected bank account
  const yearStart = startOfYear(new Date(selectedYear, 0, 1));
  const yearEnd = endOfYear(new Date(selectedYear, 0, 1));
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const currentDate = new Date();

  const monthlyData = months.map(month => {
    // Only show data for months not in the future
    if (isAfter(month, endOfMonth(currentDate))) {
      return {
        month: format(month, 'MMM'),
        income: 0,
        expenses: 0,
        savings: 0,
        includesInitialBalance: false
      };
    }
    
    // Filter incomes and expenses for selected bank account and month
    const monthIncomes = selectedBankAccount 
      ? incomes.filter(income => 
          income.bankAccountId === selectedBankAccount.id &&
          isSameMonth(parseISO(income.date), month)
        )
      : [];
    
    const monthExpenses = selectedBankAccount 
      ? expenses.filter(expense => 
          expense.bankAccountId === selectedBankAccount.id &&
          isSameMonth(parseISO(expense.date), month)
        )
      : [];
    
    const monthIncome = monthIncomes.reduce((sum, income) => sum + income.amount, 0);
    const monthExpense = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    let finalIncome = monthIncome;
    let finalSavings = monthIncome - monthExpense;
    let includesInitialBalance = false;
    
    // Add initial balance to the month when the account was created
    if (selectedBankAccount) {
      const accountCreationDate = parseISO(selectedBankAccount.createdAt);
      const accountCreationMonth = startOfMonth(accountCreationDate);
      
      // If this month is the account creation month, add the initial balance
      if (isSameMonth(month, accountCreationMonth)) {
        includesInitialBalance = true;
      }
    }
    
    return {
      month: format(month, 'MMM'),
      income: finalIncome,
      expenses: monthExpense,
      savings: finalSavings,
      includesInitialBalance
    };
  });

  // Category-wise expense data for selected bank account
  const categoryData = defaultExpenseCategories.map(category => {
    const categoryExpenses = selectedBankAccount 
      ? expenses
          .filter(expense => 
            expense.bankAccountId === selectedBankAccount.id &&
            expense.category === category.id
          )
          .reduce((sum, expense) => sum + expense.amount, 0)
      : 0;
    
    return {
      name: category.name,
      value: categoryExpenses,
      color: category.color
    };
  }).filter(item => item.value > 0);

  // Per-account category breakdowns
  const accountCategoryBreakdowns = bankAccounts.map(account => {
    const totalExpense = expenses
      .filter(expense => expense.bankAccountId === account.id)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const categoryData = defaultExpenseCategories.map(category => {
      const categoryExpenses = expenses
        .filter(expense => expense.bankAccountId === account.id && expense.category === category.id)
        .reduce((sum, expense) => sum + expense.amount, 0);
      const percentage = totalExpense > 0 ? (categoryExpenses / totalExpense) * 100 : 0;
      return {
        name: category.name,
        value: categoryExpenses,
        color: category.color,
        percentage
      };
    }).filter(item => item.value > 0);
    return {
      bankAccountId: account.id,
      bankName: account.bankName,
      nickname: account.nickname,
      categoryData
    };
  });

  const downloadReport = () => {
    const reportData = {
      bankAccounts: bankAccountAnalysis,
      selectedAccount: selectedBankAccount ? {
        ...selectedBankAccount,
        monthlyData,
        categoryData
      } : null,
      generatedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `financial-report-${selectedYear}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const downloadPDFReport = async () => {
    if (!user) {
      alert('Please log in to download the report.');
      return;
    }

    // Prepare bank account data for PDF
    const pdfBankAccounts = bankAccountAnalysis.map(analysis => ({
      bankName: analysis.account.bankName,
      nickname: analysis.account.nickname,
      startingBalance: analysis.initialBalance,
      totalIncome: analysis.totalIncome,
      totalExpense: analysis.totalExpense,
      currentBalance: analysis.currentBalance,
      createdAt: analysis.account.createdAt,
      monthlySavings: analysis.monthlySavings,
      savingsRate: analysis.savingsRate,
      transactionCount: analysis.transactionCount
    }));

    // Use monthly data for selected account, or empty array if no account selected
    const pdfMonthlyData = selectedBankAccount ? monthlyData : [];

    // Generate PDF report
    await exportFinancialReport(
      {
        displayName: user.displayName || undefined,
        email: user.email || ''
      },
      pdfBankAccounts,
      pdfMonthlyData,
      selectedYear,
      undefined, // categoryData (already handled per-account)
      accountCategoryBreakdowns // NEW
    );
  };

  // Only allow years from 2025 up to the current year
  const firstYear = 2025;
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = firstYear; y <= currentYear; y++) {
    yearOptions.push(y);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>Financial Reports</h1>
          <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
            Comprehensive analysis of your financial data across all bank accounts
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={downloadPDFReport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <FileText className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={downloadReport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <Download className="h-4 w-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Bank Account Selector */}
      <BankAccountSelector />

      {/* Report Type Selector */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setReportType('accounts')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              reportType === 'accounts' ? 'bg-red-900 text-red-300' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Building className="h-4 w-4" />
            <span>All Accounts</span>
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              reportType === 'monthly' ? 'bg-red-900 text-red-300' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Monthly Trends</span>
          </button>
          <button
            onClick={() => setReportType('category')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              reportType === 'category' ? 'bg-red-900 text-red-300' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <PieChart className="h-4 w-4" />
            <span>Category Breakdown</span>
          </button>
          <button
            onClick={() => setReportType('trends')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              reportType === 'trends' ? 'bg-red-900 text-red-300' : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Savings Trends</span>
          </button>
        </div>
      </div>

      {/* All Bank Accounts Analysis */}
      {reportType === 'accounts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>
              Bank Account Analysis
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {bankAccountAnalysis.map((analysis) => {
              const bankInfo = getBankById(analysis.account.bankName);
              return (
                <div key={analysis.account.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <Building className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {analysis.account.nickname || bankInfo?.name || analysis.account.bankName}
                        </h3>
                        <p className="text-sm text-gray-400">{bankInfo?.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Wallet className="h-4 w-4 text-green-400" />
                          <span className="text-xs text-gray-400">Initial Balance</span>
                        </div>
                        <p className="text-sm font-semibold text-white">{formatCurrency(analysis.initialBalance)}</p>
                      </div>
                      
                      <div className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <DollarSign className="h-4 w-4 text-blue-400" />
                          <span className="text-xs text-gray-400">Current Balance</span>
                        </div>
                        <p className="text-sm font-semibold text-white">{formatCurrency(analysis.currentBalance)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-900 border border-green-700 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <span className="text-xs text-green-400">Total Income</span>
                        </div>
                        <p className="text-sm font-semibold text-green-300">{formatCurrency(analysis.totalIncome)}</p>
                      </div>
                      
                      <div className="bg-red-900 border border-red-700 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-red-400" />
                          <span className="text-xs text-red-400">Total Expenses</span>
                        </div>
                        <p className="text-sm font-semibold text-red-300">{formatCurrency(analysis.totalExpense)}</p>
                      </div>
                    </div>

                    <div className="bg-blue-900 border border-blue-700 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Target className="h-4 w-4 text-blue-400" />
                        <span className="text-xs text-blue-400">Monthly Savings</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-lg font-bold ${analysis.monthlySavings >= 0 ? 'text-blue-300' : 'text-red-300'}`}>
                          {formatCurrency(analysis.monthlySavings)}
                        </p>
                        <span className="text-xs text-gray-400">
                          {analysis.savingsRate.toFixed(1)}% rate
                        </span>
                      </div>
                    </div>

                    <div className="text-center text-xs text-gray-400">
                      {analysis.transactionCount} transactions
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Trends (for selected account) */}
      {reportType === 'monthly' && selectedBankAccount && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Income vs Expenses</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value, name, props) => {
                      const data = props.payload;
                      if (name === 'Income' && data.includesInitialBalance) {
                        return [`${formatCurrency(value as number)} (includes initial balance)`, name];
                      }
                      return [formatCurrency(value as number), name];
                    }}
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Bar dataKey="income" fill="#10B981" name="Income" />
                  <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Monthly Savings Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value, name, props) => {
                      const data = props.payload;
                      if (name === 'Savings' && data.includesInitialBalance) {
                        return [`${formatCurrency(value as number)} (includes initial balance)`, name];
                      }
                      return [formatCurrency(value as number), name];
                    }}
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="savings" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    name="Savings"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown (for selected account) */}
      {reportType === 'category' && selectedBankAccount && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Expense by Category</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Category Details</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {categoryData.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-white">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{formatCurrency(category.value)}</p>
                    <p className="text-xs text-gray-400">
                      {selectedBankAccount && ((category.value / selectedBankAccount.totalExpense) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Savings Trends (for selected account) */}
      {reportType === 'trends' && selectedBankAccount && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Savings Rate Trend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData.map(data => ({
                  ...data,
                  savingsRate: data.income > 0 ? (data.savings / data.income) * 100 : 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(value) => `${value.toFixed(0)}%`} />
                  <Tooltip 
                    formatter={(value) => `${(value as number).toFixed(1)}%`}
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="savingsRate" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    name="Savings Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Financial Health Metrics</h3>
            <div className="space-y-4">
              <div className="p-4 bg-green-900 border border-green-700 rounded-lg">
                <h4 className="font-semibold text-green-300 mb-2">Average Monthly Savings</h4>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(monthlyData.reduce((sum, data) => sum + data.savings, 0) / 12)}
                </p>
              </div>
              <div className="p-4 bg-blue-900 border border-blue-700 rounded-lg">
                <h4 className="font-semibold text-blue-300 mb-2">Best Savings Month</h4>
                <p className="text-lg font-bold text-blue-400">
                  {monthlyData.reduce((best, current) => 
                    current.savings > best.savings ? current : best
                  ).month} - {formatCurrency(Math.max(...monthlyData.map(d => d.savings)))}
                </p>
              </div>
              <div className="p-4 bg-purple-900 border border-purple-700 rounded-lg">
                <h4 className="font-semibold text-purple-300 mb-2">Average Savings Rate</h4>
                <p className="text-2xl font-bold text-purple-400">
                  {(monthlyData.reduce((sum, data) => 
                    sum + (data.income > 0 ? (data.savings / data.income) * 100 : 0), 0
                  ) / 12).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No account selected message */}
      {reportType !== 'accounts' && !selectedBankAccount && (
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Select a Bank Account</h3>
          <p className="text-gray-500">Choose a bank account from the selector above to view detailed reports and charts.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;