import React, { useState } from 'react';
import {
  Target, Plus, Edit, Trash2, AlertTriangle, CheckCircle, DollarSign, Calendar
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { defaultExpenseCategories } from '../utils/categories';
import { formatCurrency } from '../utils/calculations';
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Budget, Expense } from '../types';

const Budgets: React.FC = () => {
  const {
    budgets, expenses, addBudget, updateBudget, deleteBudget, budgetProgress, selectedBankAccount
  } = useData();
  const { themeConfig, currentTheme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    budgetAmount: '',
    period: 'monthly' as 'monthly' | 'yearly',
    alertThreshold: 80
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.budgetAmount) {
      alert('Please fill in all required fields');
      return;
    }

    const budgetData = {
      category: formData.category,
      budgetAmount: Math.round(parseFloat(formData.budgetAmount) * 100) / 100, // Round to 2 decimal places
      period: formData.period,
      alertThreshold: formData.alertThreshold
    };

    if (editingBudget) {
      await updateBudget({ ...editingBudget, ...budgetData });
    } else {
      await addBudget(budgetData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      category: '',
      budgetAmount: '',
      period: 'monthly',
      alertThreshold: 80
    });
    setShowForm(false);
    setEditingBudget(null);
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      budgetAmount: budget.budgetAmount.toString(),
      period: budget.period,
      alertThreshold: budget.alertThreshold
    });
    setShowForm(true);
  };

  const getPeriodExpenses = (expenses: Expense[], period: 'monthly' | 'yearly'): Expense[] => {
    const now = new Date();
    const rangeStart = period === 'monthly' ? startOfMonth(now) : startOfYear(now);
    const rangeEnd = period === 'monthly' ? endOfMonth(now) : endOfYear(now);
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d >= rangeStart && d <= rangeEnd;
    });
  };

  const getStatus = (progress: number, threshold: number) => {
    if (progress >= 100) return { label: 'Over Budget!', color: 'red' };
    if (progress >= threshold) return { label: 'Almost There', color: 'yellow' };
    return { label: 'On Track', color: 'green' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>Budget Management</h1>
          {selectedBankAccount && (
            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Bank Account: {selectedBankAccount.nickname || selectedBankAccount.bankName}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={!selectedBankAccount}
          className={`px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors duration-200 ${
            selectedBankAccount 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Plus className="h-5 w-5" />
          <span>Create Budget</span>
        </button>
      </div>

      {!selectedBankAccount && (
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <p className="text-yellow-200">
              Please select a bank account to manage budgets. Each bank account has its own separate budgets.
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <h2 className={`text-xl font-semibold ${themeConfig.classes.heading} mb-6`}>
            {editingBudget ? 'Edit Budget' : 'Create New Budget'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium ${themeConfig.classes.label} mb-2`}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                required
              >
                <option value="">Select a category</option>
                {defaultExpenseCategories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${themeConfig.classes.label} mb-2`}>
                Budget Amount *
              </label>
              <input
                type="number"
                value={formData.budgetAmount}
                onChange={e => setFormData({ ...formData, budgetAmount: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${themeConfig.classes.label} mb-2`}>
                Period
              </label>
              <select
                value={formData.period}
                onChange={e => setFormData({ ...formData, period: e.target.value as 'monthly' | 'yearly' })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${themeConfig.classes.label} mb-2`}>
                Alert Threshold (%)
              </label>
              <input
                type="number"
                value={formData.alertThreshold}
                onChange={e => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                min={1}
                max={100}
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg"
              >
                {editingBudget ? 'Update Budget' : 'Create Budget'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.filter(budget => budget.bankAccountId === selectedBankAccount?.id).length === 0 ? (
          <div className={`col-span-full text-center ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>No Budgets Found</div>
        ) : (
          budgets.filter(budget => budget.bankAccountId === selectedBankAccount?.id).map((budget) => {
            // Filter expenses by selected bank account
            const accountExpenses = selectedBankAccount 
              ? expenses.filter(e => e.bankAccountId === selectedBankAccount.id)
              : expenses;
            
            const periodExpenses = getPeriodExpenses(accountExpenses, budget.period);
            const spent = periodExpenses
              .filter(e => e.category === budget.category)
              .reduce((sum, e) => sum + e.amount, 0);

            const progress = budgetProgress[budget.id] ?? 0;
            const remaining = budget.budgetAmount - spent;
            const status = getStatus(progress, budget.alertThreshold);
            const categoryName = defaultExpenseCategories.find(c => c.id === budget.category)?.name || budget.category;

            return (
              <div key={budget.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-lg font-semibold ${themeConfig.classes.heading}`}>{categoryName}</h2>
                  <div className="space-x-2">
                    <button onClick={() => handleEdit(budget)}>
                      <Edit className="h-4 w-4 text-gray-400 hover:text-white" />
                    </button>
                    <button onClick={async () => await deleteBudget(budget.id)}>
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className={`text-sm ${themeConfig.classes.textSecondary}`}>Spent</p>
                    <p className={`text-xl font-bold ${themeConfig.classes.text}`}>{formatCurrency(spent)}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${themeConfig.classes.textSecondary}`}>Limit</p>
                    <p className={`text-xl font-bold ${themeConfig.classes.text}`}>{formatCurrency(budget.budgetAmount)}</p>
                  </div>
                </div>

                <div className={`p-3 rounded-lg ${remaining >= 0 ? 'bg-green-900' : 'bg-red-900'}`}>
                  <p className={`text-sm ${themeConfig.classes.textSecondary}`}>
                    {remaining >= 0 ? 'Remaining' : 'Over Budget!'}
                  </p>
                  <p className={`text-lg font-bold ${themeConfig.classes.text}`}>
                    {remaining >= 0
                      ? formatCurrency(remaining)
                      : `Over by ${formatCurrency(Math.abs(remaining))}`}
                  </p>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm text-white mb-1">
                    <span className={themeConfig.classes.heading}>{progress.toFixed(1)}% used</span>
                    <span className={`text-${status.color}-400 font-medium`}>{status.label}</span>
                  </div>
                  <div className="bg-gray-600 rounded-full h-3 w-full">
                    <div
                      className={`h-3 rounded-full bg-${status.color}-500`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Budgets;
