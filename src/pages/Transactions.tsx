import React, { useState } from 'react';
import { Search, Filter, Calendar, TrendingUp, TrendingDown, Edit, Trash2, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, calculateMonthlyExpenses } from '../utils/calculations';
import { getCategoryName } from '../utils/categories';
import { format, parseISO } from 'date-fns';
import AddIncomeForm from '../components/forms/AddIncomeForm';
import AddExpenseForm from '../components/forms/AddExpenseForm';

const Transactions: React.FC = () => {
  const { incomes, expenses, deleteIncome, deleteExpense, selectedBankAccount } = useData();
  const { themeConfig, currentTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // Combine and sort transactions
  const allTransactions = [
    ...incomes.map(income => ({
      id: income.id,
      type: 'income' as const,
      amount: income.amount,
      description: income.description || income.source,
      category: income.source,
      date: income.date,
      frequency: income.frequency,
      isRecurring: false
    })),
    ...expenses.map(expense => ({
      id: expense.id,
      type: 'expense' as const,
      amount: expense.amount,
      description: expense.description || getCategoryName(expense.category),
      category: expense.category,
      date: expense.date,
      isRecurring: expense.isRecurring,
      frequency: expense.frequency
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter transactions
  const filteredTransactions = allTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = (id: string, type: 'income' | 'expense') => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      if (type === 'income') {
        deleteIncome(id);
      } else {
        deleteExpense(id);
      }
    }
  };

  // Use the same logic as Dashboard - selectedBankAccount.totalIncome already includes starting balance
  const totalIncome = selectedBankAccount ? selectedBankAccount.totalIncome : 0;
  const totalExpenses = calculateMonthlyExpenses(expenses);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>Transactions</h1>
          <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Manage your income and expenses</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowIncomeForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Income</span>
          </button>
          <button
            onClick={() => setShowExpenseForm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-900 border border-green-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Total Income</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalIncome)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-red-900 border border-red-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalExpenses)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div className="bg-blue-900 border border-blue-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">Net Balance</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(totalIncome - totalExpenses)}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                filterType === 'all' ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                filterType === 'income' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                filterType === 'expense' ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Expenses
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className={`text-lg font-semibold ${themeConfig.classes.heading}`}>
            Recent Transactions ({filteredTransactions.length})
          </h2>
        </div>
        <div className="divide-y divide-gray-700">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className={`${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>No transactions found</p>
              <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-700 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' 
                        ? 'bg-green-900 text-green-400' 
                        : 'bg-red-900 text-red-400'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${themeConfig.classes.text}`}>{transaction.description}</p>
                      <div className={`flex items-center space-x-2 text-sm ${themeConfig.classes.textSecondary}`}>
                        <span>{transaction.type === 'income' ? 'Income' : getCategoryName(transaction.category)}</span>
                        <span>•</span>
                        <span>{format(parseISO(transaction.date), 'MMM dd, yyyy')}</span>
                        {(transaction.frequency || transaction.isRecurring) && (
                          <span className={themeConfig.classes.textMuted}>(Recurring)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className={`font-semibold ${themeConfig.classes.text}`}>{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}</p>
                    </div>
                    <div className="flex space-x-1">
                      <button className="p-1 text-gray-400 hover:text-red-400 transition-colors duration-200">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(transaction.id, transaction.type)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddIncomeForm 
        isOpen={showIncomeForm} 
        onClose={() => setShowIncomeForm(false)} 
      />
      
      <AddExpenseForm 
        isOpen={showExpenseForm} 
        onClose={() => setShowExpenseForm(false)} 
      />
    </div>
  );
};

export default Transactions;