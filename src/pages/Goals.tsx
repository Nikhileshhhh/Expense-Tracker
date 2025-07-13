import React, { useState } from 'react';
import { Target, Plus, Edit, Trash2, Calendar, TrendingUp, DollarSign, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { useData, useAutoTrackSavingsGoal } from '../contexts/DataContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, validateAndRoundAmount } from '../utils/calculations';
import { format, parseISO, differenceInDays, differenceInMonths, startOfMonth } from 'date-fns';
import { Budget, Expense, SavingsGoal } from '../types';

const Goals: React.FC = () => {
  const { savingsGoals, incomes, expenses, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, selectedBankAccount } = useData();
  const { currentMonthlySavings, updateAllSavings } = useAutoTrackSavingsGoal();
  const { themeConfig, currentTheme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    description: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!formData.title || !formData.targetAmount || !formData.targetDate) {
      setFormError('Please fill in all required fields');
      return;
    }

    // Prevent past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Ignore time
    const selectedDate = new Date(formData.targetDate);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setFormError('Target date cannot be in the past.');
      return;
    }

    // Round and validate amounts
    const roundedTargetAmount = validateAndRoundAmount(formData.targetAmount);
    const roundedCurrentAmount = formData.currentAmount ? validateAndRoundAmount(formData.currentAmount) : 0;
    if (roundedTargetAmount === null || roundedTargetAmount < 0) {
      setFormError('Please enter a valid positive number for the target amount');
      return;
    }
    if (roundedCurrentAmount === null || roundedCurrentAmount < 0) {
      setFormError('Please enter a valid positive number for the current amount');
      return;
    }

    const goalData = {
      title: formData.title,
      targetAmount: Math.round(roundedTargetAmount * 100) / 100, // Ensure exact 2 decimal places
      currentAmount: Math.round(roundedCurrentAmount * 100) / 100, // Ensure exact 2 decimal places
      targetDate: formData.targetDate,
      description: formData.description
    };

    console.log('🎯 Submitting goal data:', goalData);
    
    if (editingGoal) {
      console.log('🎯 Updating existing goal');
      await updateSavingsGoal({ ...editingGoal, ...goalData });
    } else {
      console.log('🎯 Creating new goal');
      await addSavingsGoal(goalData);
    }

    console.log('🎯 Goal operation completed, resetting form');
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      description: ''
    });
    setShowForm(false);
    setEditingGoal(null);
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate,
      description: goal.description || ''
    });
    setShowForm(true);
  };

  // Calculate actual savings progress based on auto-tracked amount
  const calculateActualSavings = (goal: SavingsGoal) => {
    // Use the auto-tracked amount which is automatically updated by DataContext
    // This ensures it always reflects the current monthly savings (income - expenses)
    const autoTrackedSavings = goal.autoTrackedAmount || 0;
    
    // Use the higher of manual entry or auto-tracked savings
    return Math.max(goal.currentAmount, autoTrackedSavings);
  };

  const getGoalProgress = (goal: any) => {
    const actualSavings = calculateActualSavings(goal);
    return goal.targetAmount > 0 ? (actualSavings / goal.targetAmount) * 100 : 0;
  };

  const getDaysRemaining = (targetDate: string) => {
    return differenceInDays(parseISO(targetDate), new Date());
  };

  // Calculate monthly savings needed
  const getMonthlyTarget = (goal: any) => {
    const actualSavings = calculateActualSavings(goal);
    const remaining = goal.targetAmount - actualSavings;
    const daysLeft = getDaysRemaining(goal.targetDate);
    const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
    return remaining > 0 ? remaining / monthsLeft : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>Savings Goals</h1>
          <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-1`}>Set targets and track your savings progress automatically</p>
          {selectedBankAccount && (
            <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Bank Account: {selectedBankAccount.nickname || selectedBankAccount.bankName}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors duration-200 font-medium bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="h-5 w-5" />
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      {selectedBankAccount && (
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-400" />
            <p className="text-blue-200">
              Goals are global and apply to all your bank accounts. Your current monthly savings from {selectedBankAccount.nickname || selectedBankAccount.bankName} will be used for auto-tracking.
            </p>
          </div>
        </div>
      )}

      {/* Simple Explanation */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className={`text-lg font-semibold ${themeConfig.classes.heading} mb-3`}>🎯 How Auto-Tracking Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
            <div>
              <p className={`${themeConfig.classes.heading} font-medium`}>Set Your Target</p>
              <p className={themeConfig.classes.textMuted}>Define what you're saving for and how much you need</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
            <div>
              <p className={`${themeConfig.classes.heading} font-medium`}>Auto-Track Progress</p>
              <p className={themeConfig.classes.textMuted}>We calculate your savings from your income minus expenses</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
            <div>
              <p className={`${themeConfig.classes.heading} font-medium`}>Stay on Track</p>
              <p className={themeConfig.classes.textMuted}>See how much you need to save monthly to reach your goal</p>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-red-900 rounded-lg border border-red-700">
          <p className="text-red-300 text-sm">
            <strong>Auto-Tracking:</strong> Your savings progress updates automatically based on your total available balance. The auto-tracked amount reflects your current bank balance (Starting Balance + Income - Expenses) and updates in real-time when you add or modify transactions. This ensures your goals always show your actual accumulated savings!
          </p>
          {selectedBankAccount && (
            <div className="mt-3 p-2 bg-gray-800 rounded border border-gray-600">
              <p className="text-red-200 text-xs">
                <strong>Current Available Balance:</strong> {formatCurrency(currentMonthlySavings)}
              </p>
              <button
                onClick={() => {
                  console.log('🎯 Manual trigger: Updating goals...');
                  updateAllSavings();
                }}
                className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
              >
                Manual Update Goals
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Goal Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className={`text-xl font-semibold ${themeConfig.classes.heading} mb-6`}>
            {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
          </h2>
          {formError && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-4">
              <p className="text-red-200 text-sm">{formError}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${themeConfig.classes.label} mb-2`}>
                  What are you saving for? *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="e.g., Emergency Fund, Vacation, New Car"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeConfig.classes.label} mb-2`}>
                  How much do you need? *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Enter target amount"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${themeConfig.classes.label} mb-2`}>
                  Manual savings amount (optional)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                    placeholder="We'll auto-calculate from your transactions"
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Leave blank to auto-track from your income/expenses</p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeConfig.classes.label} mb-2`}>
                  When do you want to achieve this? *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${themeConfig.classes.label} mb-2`}>
                Add a note (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Why is this goal important to you?"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium"
              >
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savingsGoals.length === 0 ? (
          <div className="col-span-full bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <Target className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className={`text-xl font-medium ${currentTheme === 'dark' ? 'text-white' : 'text-white'} mb-2`}>No Savings Goals</h3>
            <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-white'} mb-6`}>Set your first savings goal to start building your future</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          savingsGoals.map((goal) => {
            const actualSavings = calculateActualSavings(goal);
            const progress = getGoalProgress(goal);
            const daysRemaining = getDaysRemaining(goal.targetDate);
            const isOverdue = daysRemaining < 0;
            const remaining = goal.targetAmount - actualSavings;
            const monthlyTarget = getMonthlyTarget(goal);

            return (
              <div key={goal.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${themeConfig.classes.heading}`}>{goal.title}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => await deleteSavingsGoal(goal.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {goal.description && (
                  <p className={`text-sm ${themeConfig.classes.textMuted} mb-4 italic`}>"{goal.description}"</p>
                )}

                <div className="space-y-4">
                  {/* Amount Summary */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className={`text-gray-400 ${themeConfig.classes.textSecondary}`}>Auto-Tracked Savings</p>
                      <p className={`text-xl font-bold ${themeConfig.classes.text}`}>{formatCurrency(goal.autoTrackedAmount || 0)}</p>
                      <p className={`text-xs ${themeConfig.classes.textSecondary}`}>
                        {goal.autoTrackedAmount !== undefined ? 'Total Available Balance (Starting + Income - Expenses)' : 'Not available'}
                      </p>
                    </div>
                    <div>
                      <p className={`text-gray-400 ${themeConfig.classes.textSecondary}`}>Target</p>
                      <p className={`text-xl font-bold ${themeConfig.classes.text}`}>{formatCurrency(goal.targetAmount)}</p>
                    </div>
                  </div>

                  {/* Remaining Amount */}
                  <div className={`p-3 rounded-lg ${remaining <= 0 ? 'bg-green-900' : 'bg-gray-700'}`}>
                    <p className={`text-sm ${themeConfig.classes.textSecondary}`}>
                      {remaining <= 0 ? 'Goal Achieved! 🎉' : 'Still Need'}
                    </p>
                    <p className={`text-lg font-bold ${themeConfig.classes.text}`}>
                      {remaining <= 0 ? 'Congratulations!' : formatCurrency(remaining)}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={`text-gray-400 ${themeConfig.classes.textSecondary}`}>{progress.toFixed(1)}% complete</span>
                      <span className={`flex items-center space-x-1 font-medium ${
                        progress >= 100 ? 'text-green-400' : 
                        isOverdue ? 'text-red-400' : 'text-red-400'
                      }`}>
                        <TrendingUp className="h-4 w-4" />
                        <span>
                          {progress >= 100 ? 'Completed!' : 
                           isOverdue ? 'Overdue' : 
                           goal.autoTrackedAmount !== undefined ? 'Auto-Tracking Active' : 'Manual Tracking'}
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          progress >= 100 ? 'bg-green-500' : 
                          isOverdue ? 'bg-red-500' : 'bg-red-600'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-700">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>{format(parseISO(goal.targetDate), 'MMM dd, yyyy')}</span>
                    </div>
                    <span className={`font-medium ${themeConfig.classes.text}`}>
                      {isOverdue 
                        ? `${Math.abs(daysRemaining)} days overdue`
                        : daysRemaining === 0 
                        ? 'Due today'
                        : `${daysRemaining} days left`
                      }
                    </span>
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

export default Goals;