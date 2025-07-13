import React, { useState } from 'react';
import { Search, Filter, Calendar, TrendingUp, TrendingDown, Edit, Trash2, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, calculateMonthlyExpenses } from '../utils/calculations';
import { getCategoryName } from '../utils/categories';
import { format, parseISO } from 'date-fns';
import AddIncomeForm from '../components/forms/AddIncomeForm';
import AddExpenseForm from '../components/forms/AddExpenseForm';
import { useMonthlySummaries } from '../utils/useMonthlySummaries';
import { useAuth } from '../contexts/AuthContext';

const Transactions: React.FC = () => {
  const { incomes, expenses, deleteIncome, deleteExpense, selectedBankAccount } = useData();
  const { themeConfig, currentTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const { user } = useAuth();
  const now = new Date();
  const currentMonthId = format(now, 'MMM_yyyy').toLowerCase();
  const currentYear = now.getFullYear();
  const { summaries: monthlySummaries } = useMonthlySummaries(
    user?.uid,
    selectedBankAccount?.id,
    currentYear
  );
  const currentMonthSummary = monthlySummaries.find(s =>
    s.month && format(new Date(`${s.month} 1, ${s.year}`), 'MMM_yyyy').toLowerCase() === currentMonthId
  );
  const monthlyIncome = currentMonthSummary?.monthlyIncome ?? 0;
  const monthlyExpense = currentMonthSummary?.monthlyExpense ?? 0;
  const monthlySavings = currentMonthSummary?.monthlySavings ?? 0;

  // Filter incomes and expenses by selected bank account
  const filteredIncomes = selectedBankAccount
    ? incomes.filter((income) => income.bankAccountId === selectedBankAccount.id)
    : incomes;

  const filteredExpenses = selectedBankAccount
    ? expenses.filter((expense) => expense.bankAccountId === selectedBankAccount.id)
    : expenses;

  // Debug logs for transactions
  console.log('📊 Transactions page - Selected bank account:', selectedBankAccount?.id);
  console.log('📊 Transactions page - All incomes:', incomes.map(i => ({ id: i.id, amount: i.amount, description: i.description, source: i.source, date: i.date, bankAccountId: i.bankAccountId })));
  console.log('📊 Transactions page - All expenses:', expenses.map(e => ({ id: e.id, amount: e.amount, description: e.description, category: e.category, date: e.date, bankAccountId: e.bankAccountId })));
  console.log('📊 Transactions page - Filtered incomes:', filteredIncomes.map(i => ({ id: i.id, amount: i.amount, description: i.description, source: i.source, date: i.date, bankAccountId: i.bankAccountId })));
  console.log('📊 Transactions page - Filtered expenses:', filteredExpenses.map(e => ({ id: e.id, amount: e.amount, description: e.description, category: e.category, date: e.date, bankAccountId: e.bankAccountId })));

  // Combine and sort transactions
  const allTransactions = [
    ...filteredIncomes.map(income => {
      const description = income.description || income.source || 'Income';
      console.log('📊 Mapping income in Transactions:', { id: income.id, amount: income.amount, description, source: income.source, date: income.date });
      return {
        id: income.id,
        type: 'income' as const,
        amount: income.amount,
        description,
        category: income.source,
        date: income.date,
        frequency: income.frequency,
        isRecurring: false
      };
    }),
    ...filteredExpenses.map(expense => {
      const description = expense.description || getCategoryName(expense.category);
      console.log('📊 Mapping expense in Transactions:', { id: expense.id, amount: expense.amount, description, category: expense.category, date: expense.date });
      return {
        id: expense.id,
        type: 'expense' as const,
        amount: expense.amount,
        description,
        category: expense.category,
        date: expense.date,
        isRecurring: expense.isRecurring,
        frequency: expense.frequency
      };
    })
  ].filter(transaction => {
    const isValidDate = !isNaN(new Date(transaction.date).getTime());
    if (!isValidDate) {
      console.log('📊 Filtering out transaction with invalid date in Transactions:', transaction);
    }
    return isValidDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  console.log('📊 Transactions page - Final allTransactions:', allTransactions.map(t => ({ id: t.id, type: t.type, amount: t.amount, description: t.description, date: t.date })));

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

  // Use the bank account's totalIncome and totalExpense fields (which include starting balance and all expenses)
  const totalIncome = selectedBankAccount ? selectedBankAccount.totalIncome : 0;
  const totalExpenses = selectedBankAccount ? selectedBankAccount.totalExpense : 0;
  
  // Debug logging
  console.log('📊 Transactions page - selectedBankAccount:', selectedBankAccount);
  console.log('📊 Transactions page - totalIncome:', totalIncome);
  console.log('📊 Transactions page - totalExpenses:', totalExpenses);

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-900 border border-green-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-sm font-medium">Monthly Income</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(monthlyIncome)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-red-900 border border-red-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-sm font-medium">Monthly Expenses</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(monthlyExpense)}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div className="bg-blue-900 border border-blue-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">Monthly Savings</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(monthlySavings)}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-purple-900 border border-purple-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-400 text-sm font-medium">Monthly Savings Rate</p>
              <p className="text-2xl font-bold text-white">{currentMonthSummary ? `${currentMonthSummary.savingsRate.toFixed(1)}%` : '0.0%'}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-400 rotate-45" />
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
                <div className="divide-y divide-gray-700 overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className={`${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>No transactions found</p>
              <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="min-w-[600px]">
              {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-700 transition-colors duration-200 min-w-0">
                <div className="flex items-center justify-between min-w-0">
                  <div className="flex items-center space-x-4 flex-1 min-w-0 mr-4">
                    <div className={`p-2 rounded-full flex-shrink-0 ${
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
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${themeConfig.classes.text} truncate`} title={transaction.description}>{transaction.description}</p>
                      <div className={`flex items-center space-x-2 text-sm ${themeConfig.classes.textSecondary} flex-wrap`}>
                        <span className="truncate" title={transaction.type === 'income' ? 'Income' : getCategoryName(transaction.category)}>{transaction.type === 'income' ? 'Income' : getCategoryName(transaction.category)}</span>
                        <span className="flex-shrink-0">•</span>
                        <span className="flex-shrink-0">{format(parseISO(transaction.date), 'MMM dd, yyyy')}</span>
                        {(transaction.frequency || transaction.isRecurring) && (
                          <span className={`${themeConfig.classes.textMuted} flex-shrink-0`}>(Recurring)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <div className="text-right">
                      <p className={`font-semibold ${themeConfig.classes.text} text-sm`}>{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}</p>
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
              ))}
            </div>
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