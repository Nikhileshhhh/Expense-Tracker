import React, { useState, useEffect } from 'react';
import { X, Plus, DollarSign, Calendar, Repeat, Building } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { getBankById } from '../../utils/banks';
import { validateAndRoundAmount } from '../../utils/calculations';

interface AddIncomeFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddIncomeForm: React.FC<AddIncomeFormProps> = ({ isOpen, onClose }) => {
  const { addIncome, bankAccounts, selectedBankAccount } = useData();
  const [formData, setFormData] = useState({
    bankAccountId: selectedBankAccount?.id || '',
    source: '',
    amount: '',
    frequency: 'monthly' as 'monthly' | 'yearly' | 'one-time',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

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
        source: '',
        amount: '',
        frequency: 'monthly',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
    }
  }, [isOpen, selectedBankAccount]);

  const incomeSources = [
    'Salary',
    'Part-time Job',
    'Freelancing',
    'Rental Income',
    'Business Income',
    'Investment Returns',
    'Bonus',
    'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.source || !formData.amount || !formData.bankAccountId) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate and round the amount to 2 decimal places
    const rounded = validateAndRoundAmount(formData.amount);
    if (rounded === null) {
      alert('Please enter a valid positive number for the amount');
      return;
    }

    addIncome({
      bankAccountId: formData.bankAccountId,
      source: formData.source,
      amount: rounded,
      frequency: formData.frequency,
      date: formData.date,
      description: formData.description
    });

    setFormData({
      bankAccountId: selectedBankAccount?.id || '',
      source: '',
      amount: '',
      frequency: 'monthly',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Add Income</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bank Account *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={formData.bankAccountId}
                onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
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
              Income Source *
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white"
              required
            >
              <option value="">Select income source</option>
              {incomeSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

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
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow digits, single decimal point, and empty string
                  if (/^\d*\.?\d*$/.test(value) || value === '') {
                    setFormData({ ...formData, amount: value });
                  }
                }}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                placeholder="Enter amount"
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Amount will be rounded to 2 decimal places</p>
          </div>

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
                <option value="one-time">One-time</option>
              </select>
            </div>
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
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
              placeholder="Add any additional notes..."
              rows={3}
            />
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
              className="flex-1 bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-3 rounded-lg hover:from-red-700 hover:to-red-900 transition-all duration-200 transform hover:scale-[1.02]"
            >
              Add Income
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIncomeForm;