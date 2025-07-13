import React, { useState } from 'react';
import {
  Building, Plus, Edit, Trash2, TrendingUp, TrendingDown, Wallet, BarChart3
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { getBankById } from '../utils/banks';
import {
  formatCurrency,
  calculateMonthlyExpenses,
  calculateMonthlyIncome
} from '../utils/calculations';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { defaultExpenseCategories } from '../utils/categories';
import AddBankAccountForm from '../components/forms/AddBankAccountForm';

const BankAccounts: React.FC = () => {
  const {
    bankAccounts,
    selectedBankAccount,
    setSelectedBankAccount,
    incomes,
    expenses,
    deleteBankAccount
  } = useData();

  const { themeConfig, currentTheme } = useTheme();
  const [showAddForm, setShowAddForm] = useState(false);

  const getBankAccountSummary = (accountId: string) => {
    const account = bankAccounts.find(a => a.id === accountId);
    const accountIncomes = incomes.filter(i => i.bankAccountId === accountId);
    const accountExpenses = expenses.filter(e => e.bankAccountId === accountId);

    // Use the bank account's totalIncome field (which includes starting balance when no real income)
    const totalIncome = account ? account.totalIncome : 0;
    const totalExpenses = calculateMonthlyExpenses(accountExpenses);
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    const categoryData = defaultExpenseCategories.map(category => {
      const categoryExpenses = accountExpenses
        .filter(e => e.category === category.id)
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        name: category.name,
        value: categoryExpenses,
        color: category.color
      };
    }).filter(c => c.value > 0);

    const recentTransactions = [
      ...accountIncomes.map(i => ({ ...i, type: 'income' as const })),
      ...accountExpenses.map(e => ({ ...e, type: 'expense' as const }))
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      totalIncome,
      totalExpenses,
      savings,
      savingsRate,
      categoryData,
      recentTransactions
    };
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (window.confirm('Are you sure you want to delete this bank account?')) {
      try {
        await deleteBankAccount(accountId);
      } catch (err) {
        console.error('Delete failed:', err);
        alert('Error deleting account. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>
            Bank Accounts
          </h1>
          <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>
            Manage your bank accounts and view detailed analytics
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Bank Account</span>
        </button>
      </div>

      {/* Empty State */}
      {bankAccounts.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
          <Building className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className={`text-xl font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-black'} mb-2`}>
            No Bank Accounts
          </h3>
          <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
            Add your first bank account to start tracking your finances
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg"
          >
            Add Your First Account
          </button>
        </div>
      ) : (
        <>
          {/* Account Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bankAccounts.map(account => {
              const bank = getBankById(account.bankName);
              const summary = getBankAccountSummary(account.id);
              const isSelected = selectedBankAccount?.id === account.id;

              return (
                <div
                  key={account.id}
                  className={`bg-gray-800 rounded-xl p-6 border transition-all cursor-pointer ${
                    isSelected ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedBankAccount(account)}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: bank?.color }}
                      >
                        {bank?.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {account.nickname || bank?.name}
                        </h3>
                        <p className="text-sm text-gray-400">{bank?.name}</p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button className="p-1 text-gray-400 hover:text-red-400">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAccount(account.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Current Balance</span>
                      <span className="text-xl font-bold text-white">
                        {formatCurrency(account.currentBalance)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 rounded bg-green-900 border border-green-700">
                        <p className="font-semibold text-green-400">Income</p>
                        <p className="text-white">{formatCurrency(summary.totalIncome)}</p>
                      </div>
                      <div className="p-2 rounded bg-red-900 border border-red-700">
                        <p className="font-semibold text-red-400">Expenses</p>
                        <p className="text-white">{formatCurrency(summary.totalExpenses)}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Savings Rate</span>
                        <span className="font-medium text-white">{summary.savingsRate.toFixed(1)}%</span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 p-2 bg-red-900 rounded border border-red-700 text-center text-white text-xs font-medium">
                        ✓ Currently Selected Account
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Form Modal */}
          <AddBankAccountForm isOpen={showAddForm} onClose={() => setShowAddForm(false)} />
        </>
      )}
    </div>
  );
};

export default BankAccounts;
