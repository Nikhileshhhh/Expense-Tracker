import React, { useState } from 'react';
import { Building, Plus, Edit, Trash2, TrendingUp, TrendingDown, Wallet, BarChart3 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { getBankById } from '../utils/banks';
import { formatCurrency, calculateMonthlyExpenses } from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { defaultExpenseCategories } from '../utils/categories';
import AddBankAccountForm from '../components/forms/AddBankAccountForm';

const BankAccounts: React.FC = () => {
  const { bankAccounts, selectedBankAccount, setSelectedBankAccount, incomes, expenses, deleteBankAccount } = useData();
  const { themeConfig, currentTheme } = useTheme();
  const [showAddForm, setShowAddForm] = useState(false);

  const getBankAccountSummary = (accountId: string) => {
    const accountIncomes = incomes.filter(income => income.bankAccountId === accountId);
    const accountExpenses = expenses.filter(expense => expense.bankAccountId === accountId);
    
    // Use the account's totalIncome which already includes starting balance and all income transactions
    const account = bankAccounts.find(a => a.id === accountId);
    const totalIncome = account ? account.totalIncome : 0;
    const totalExpenses = calculateMonthlyExpenses(accountExpenses);
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // Category breakdown for this account
    const categoryData = defaultExpenseCategories.map(category => {
      const categoryExpenses = accountExpenses
        .filter(expense => expense.category === category.id)
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        name: category.name,
        value: categoryExpenses,
        color: category.color
      };
    }).filter(item => item.value > 0);

    return {
      totalIncome,
      totalExpenses,
      savings,
      savingsRate,
      categoryData,
      recentTransactions: [
        ...accountIncomes.map(income => ({ ...income, type: 'income' as const })),
        ...accountExpenses.map(expense => ({ ...expense, type: 'expense' as const }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
    };
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (window.confirm('Are you sure you want to delete this bank account? This will also delete all associated transactions.')) {
      try {
        await deleteBankAccount(accountId);
      } catch (error) {
        console.error('Error deleting bank account:', error);
        alert('Failed to delete bank account. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>Bank Accounts</h1>
          <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Manage your bank accounts and view detailed analytics</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors duration-200 font-medium"
        >
          <Plus className="h-5 w-5" />
          <span>Add Bank Account</span>
        </button>
      </div>

      {bankAccounts.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
          <Building className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className={`text-xl font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-black'} mb-2`}>No Bank Accounts</h3>
          <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}>Add your first bank account to start tracking your finances</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium"
          >
            Add Your First Account
          </button>
        </div>
      ) : (
        <>
          {/* Bank Account Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bankAccounts.map((account) => {
              const bank = getBankById(account.bankName);
              const summary = getBankAccountSummary(account.id);
              const isSelected = selectedBankAccount?.id === account.id;

              return (
                <div
                  key={account.id}
                  className={`bg-gray-800 rounded-xl p-6 border transition-all duration-200 cursor-pointer hover:shadow-lg ${
                    isSelected ? 'border-red-500 ring-2 ring-red-500 ring-opacity-50' : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedBankAccount(account)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${themeConfig.classes.text}`}
                        style={{ backgroundColor: bank?.color }}
                      >
                        {bank?.icon}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${themeConfig.classes.heading}`}>
                          {account.nickname || bank?.name}
                        </h3>
                        <p className={`text-sm ${themeConfig.classes.textSecondary}`}>{bank?.name}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button className="p-1 text-gray-400 hover:text-red-400 transition-colors duration-200">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAccount(account.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={themeConfig.classes.textMuted}>Current Balance</span>
                      <span className={`text-xl font-bold ${themeConfig.classes.text}`}>
                        {formatCurrency(account.currentBalance)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 rounded" style={{ background: 'rgba(16,185,129,0.1)' }}>
                        <p className="font-semibold" style={{ color: '#10B981' }}>Income</p>
                        <p className={`font-semibold ${themeConfig.classes.text}`}>{formatCurrency(summary.totalIncome)}</p>
                      </div>
                      <div className="p-2 rounded" style={{ background: 'rgba(239,68,68,0.1)' }}>
                        <p className="font-semibold" style={{ color: '#EF4444' }}>Expenses</p>
                        <p className={`font-semibold ${themeConfig.classes.text}`}>{formatCurrency(summary.totalExpenses)}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className={themeConfig.classes.textMuted}>Savings Rate</span>
                        <span className={`font-medium ${themeConfig.classes.text}`}>{summary.savingsRate.toFixed(1)}%</span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 p-2 bg-red-900 rounded border border-red-700">
                        <p className={`text-xs font-medium text-center ${themeConfig.classes.text}`}>
                          ✓ Currently Selected Account
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Analytics for Selected Account */}
          {selectedBankAccount && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <BarChart3 className="h-6 w-6 text-red-400" />
                <h2 className={`text-xl font-semibold ${themeConfig.classes.heading}`}>
                  Detailed Analytics - {selectedBankAccount.nickname || getBankById(selectedBankAccount.bankName)?.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown Chart */}
                <div>
                  <h3 className={`text-lg font-medium ${themeConfig.classes.heading} mb-4`}>Expense Categories</h3>
                  <div className="h-80">
                    {getBankAccountSummary(selectedBankAccount.id).categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getBankAccountSummary(selectedBankAccount.id).categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {getBankAccountSummary(selectedBankAccount.id).categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <p className={themeConfig.classes.textMuted}>No expense data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Transactions */}
                <div>
                  <h3 className={`text-lg font-medium ${themeConfig.classes.heading} mb-4`}>Recent Transactions</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {getBankAccountSummary(selectedBankAccount.id).recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'income' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
                          }`}>
                            {transaction.type === 'income' ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className={`font-medium ${themeConfig.classes.heading} text-sm`}>
                              {transaction.type === 'income' ? transaction.source : transaction.description}
                            </p>
                            <p className={`text-xs ${themeConfig.classes.textMuted}`}>{transaction.date}</p>
                          </div>
                        </div>
                        <p className={`font-semibold ${themeConfig.classes.text}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <AddBankAccountForm isOpen={showAddForm} onClose={() => setShowAddForm(false)} />
    </div>
  );
};

export default BankAccounts;