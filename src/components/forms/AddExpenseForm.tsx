import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Repeat, Tag, Building, AlertTriangle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { defaultExpenseCategories } from '../../utils/categories';
import { getBankById } from '../../utils/banks';
import { addMonths } from 'date-fns';
import { calculateMonthlyIncome, calculateMonthlyExpenses, formatCurrency, validateAndRoundAmount } from '../../utils/calculations';

interface AddExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddExpenseForm: React.FC<AddExpenseFormProps> = ({ isOpen, onClose }) => {
  const { addExpense, bankAccounts, selectedBankAccount, incomes, expenses } = useData();
  const [formData, setFormData] = useState({
    bankAccountId: selectedBankAccount?.id || '',
    category: '',
    subcategory: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    isRecurring: false,
    frequency: 'monthly' as 'monthly' | 'yearly',
    nextDueDate: ''
  });
  const [validationError, setValidationError] = useState('');

  // Update bank account selection when selectedBankAccount changes
  useEffect(() => {
    if (selectedBankAccount?.id) {
      setFormData(prev => ({
        ...prev,
        bankAccountId: selectedBankAccount.id
      }));
    }
  }, [selectedBankAccount]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        bankAccountId: selectedBankAccount?.id || '',
        category: '',
        subcategory: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        isRecurring: false,
        frequency: 'monthly',
        nextDueDate: ''
      });
      setValidationError('');
    }
  }, [isOpen, selectedBankAccount]);

  const selectedCategory = defaultExpenseCategories.find(cat => cat.id === formData.category);
  const selectedAccount = bankAccounts.find(account => account.id === formData.bankAccountId);

  // Calculate monthly savings using the same logic as Dashboard for consistency
  const accountIncomes = selectedAccount ? incomes.filter(income => income.bankAccountId === selectedAccount.id) : [];
  const accountExpenses = selectedAccount ? expenses.filter(expense => expense.bankAccountId === selectedAccount.id) : [];
  
  const transactionIncome = accountIncomes.reduce((sum, income) => sum + income.amount, 0);
  const transactionExpenses = accountExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const startingBalance = selectedAccount?.startingBalance || 0;
  
  // Calculate total income: transaction incomes + starting balance
  const totalIncome = transactionIncome + startingBalance;
  // Calculate monthly savings: total income - total expenses
  const monthlySavings = totalIncome - transactionExpenses;
  const currentBalance = selectedAccount?.currentBalance || 0;

  const handleAmountChange = (value: string) => {
    // Allow digits, single decimal point, and empty string
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setFormData({ ...formData, amount: value });
      // Live validation
      const rounded = validateAndRoundAmount(value);
      if (rounded === null) {
        setValidationError('Please enter a valid positive number for the amount');
        return;
      }
      if (selectedAccount && rounded > currentBalance) {
        setValidationError(`Amount cannot exceed current balance of ${formatCurrency(currentBalance)}`);
        return;
      }
      if (selectedAccount && rounded > monthlySavings) {
        setValidationError(`Amount cannot exceed your monthly savings of ${formatCurrency(monthlySavings)}`);
        return;
      }
      setValidationError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.amount || !formData.bankAccountId) {
      setValidationError('Please fill in all required fields');
      return;
    }
    // Validate and round the amount to 2 decimal places
    const rounded = validateAndRoundAmount(formData.amount);
    if (rounded === null) {
      setValidationError('Please enter a valid positive number for the amount');
      return;
    }
    if (selectedAccount && rounded > currentBalance) {
      setValidationError(`Amount cannot exceed current balance of ${formatCurrency(currentBalance)}`);
      return;
    }
    if (selectedAccount && rounded > monthlySavings) {
      setValidationError(`Amount cannot exceed your monthly savings of ${formatCurrency(monthlySavings)}`);
      return;
    }
    addExpense({
      bankAccountId: formData.bankAccountId,
      category: formData.category,
      subcategory: formData.subcategory,
      amount: rounded,
      date: formData.date,
      description: formData.description,
      isRecurring: formData.isRecurring,
      frequency: formData.frequency,
      nextDueDate: formData.nextDueDate
    });
    setFormData({
      bankAccountId: selectedBankAccount?.id || '',
      category: '',
      subcategory: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      isRecurring: false,
      frequency: 'monthly',
      nextDueDate: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Add Expense</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Account Balance and Savings Info */}
          {selectedAccount && (
            <div className="bg-gray-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Current Balance:</span>
                <span className={`font-semibold ${currentBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(currentBalance)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Monthly Savings:</span>
                <span className={`font-semibold ${monthlySavings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(monthlySavings)}
                </span>
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-200 text-sm">{validationError}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bank Account *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={formData.bankAccountId}
                onChange={(e) => {
                  setFormData({ ...formData, bankAccountId: e.target.value });
                  setValidationError(''); // Clear error when account changes
                }}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white"
                required
              >
                <option value="">Select bank account</option>
                {bankAccounts.map(account => {
                  const bank = getBankById(account.bankName);
                  return (
                    <option key={account.id} value={account.id}>
                      {bank?.icon} {account.nickname || bank?.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white"
                required
              >
                <option value="">Select category</option>
                {defaultExpenseCategories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedCategory?.subcategories && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subcategory
              </label>
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white"
              >
                <option value="">Select subcategory (optional)</option>
                {selectedCategory.subcategories.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                inputMode="decimal"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                placeholder="Enter amount"
                required
              />
            </div>
            {selectedAccount && (
              <p className="text-xs text-gray-400 mt-1">
                Max allowed: {formatCurrency(currentBalance)} (amount will be rounded to 2 decimal places)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
              placeholder="Enter description"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-600 rounded bg-gray-700"
              />
              <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-300">
                This is a recurring expense
              </label>
            </div>

            {formData.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Frequency
                </label>
                <div className="relative">
                  <Repeat className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!!validationError}
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseForm;